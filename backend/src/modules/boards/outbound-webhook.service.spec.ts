import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock dns/promises before importing the service ──────────────────────────
vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(),
}));

import { lookup } from 'node:dns/promises';
import { isPrivateIp, buildIpUrl } from './outbound-webhook.service';
import { OutboundWebhookService } from './outbound-webhook.service';

const mockLookup = lookup as ReturnType<typeof vi.fn>;

// ─── isPrivateIp ─────────────────────────────────────────────────────────────

describe('isPrivateIp – IPv4', () => {
  it.each([
    ['127.0.0.1', true, 'loopback'],
    ['127.255.255.255', true, 'loopback range'],
    ['10.0.0.1', true, 'RFC-1918 /8'],
    ['10.255.255.255', true, 'RFC-1918 /8 end'],
    ['192.168.1.1', true, 'RFC-1918 /16'],
    ['172.16.0.1', true, 'RFC-1918 /12 start'],
    ['172.31.255.255', true, 'RFC-1918 /12 end'],
    ['169.254.169.254', true, 'AWS/Azure IMDS'],
    ['169.254.0.1', true, 'link-local'],
    ['100.64.0.1', true, 'CGNAT start'],
    ['100.100.100.200', true, 'Alibaba Cloud IMDS'],
    ['100.127.255.255', true, 'CGNAT end'],
    ['0.0.0.0', true, 'unspecified'],
    // public addresses
    ['8.8.8.8', false, 'Google DNS'],
    ['1.1.1.1', false, 'Cloudflare DNS'],
    ['93.184.216.34', false, 'example.com'],
    ['100.63.255.255', false, 'just before CGNAT'],
    ['100.128.0.1', false, 'just after CGNAT'],
    ['172.15.255.255', false, 'just before RFC-1918 /12'],
    ['172.32.0.1', false, 'just after RFC-1918 /12'],
  ])('%s → %s (%s)', (ip, expected) => {
    expect(isPrivateIp(ip)).toBe(expected);
  });
});

describe('isPrivateIp – IPv6', () => {
  it.each([
    ['::1', true, 'loopback'],
    ['fc00::1', true, 'ULA fc00::/8'],
    ['fc01::abcd', true, 'ULA fc'],
    ['fd00::1', true, 'ULA fd00::/8'],
    ['fd00:ec2::254', true, 'AWS IMDS IPv6'],
    ['fdab:cdef::1', true, 'ULA fd arbitrary'],
    ['fe80::1', true, 'link-local fe80::/10 common'],
    ['fe90::1', true, 'link-local fe80::/10 fe90'],
    ['fea0::1', true, 'link-local fe80::/10 fea0'],
    ['feb0::cafe', true, 'link-local fe80::/10 feb0'],
    ['febf::1', true, 'link-local fe80::/10 febf'],
    // IPv6-mapped IPv4
    ['::ffff:169.254.169.254', true, 'mapped AWS IMDS'],
    ['::ffff:127.0.0.1', true, 'mapped loopback'],
    ['::ffff:10.0.0.1', true, 'mapped RFC-1918'],
    ['::ffff:100.100.100.200', true, 'mapped Alibaba IMDS'],
    ['::ffff:a9fe:a9fe', true, 'mapped IMDS hex form'],
    ['::ffff:0:192.168.0.1', true, 'SIIT mapped private'],
    ['::ffff:8.8.8.8', false, 'mapped public'],
    ['::ffff:808:808', false, 'mapped public hex'],
    // public addresses
    ['2001:db8::1', false, 'documentation range'],
    ['2606:4700::1111', false, 'Cloudflare public'],
    ['fec0::1', false, 'site-local (deprecated, not ULA)'],
  ])('%s → %s (%s)', (ip, expected) => {
    expect(isPrivateIp(ip)).toBe(expected);
  });
});

describe('isPrivateIp – malformed', () => {
  it('treats malformed IPv4 as private', () => {
    expect(isPrivateIp('not-an-ip')).toBe(true);
    expect(isPrivateIp('256.0.0.1')).toBe(true);
  });
});

// ─── buildIpUrl ──────────────────────────────────────────────────────────────

describe('buildIpUrl', () => {
  it('replaces IPv4 hostname', () => {
    const url = new URL('http://example.com/path?q=1');
    expect(buildIpUrl(url, '93.184.216.34')).toBe('http://93.184.216.34/path?q=1');
  });

  it('replaces hostname with IPv4 and preserves explicit port', () => {
    const url = new URL('http://example.com:8080/path');
    expect(buildIpUrl(url, '93.184.216.34')).toBe('http://93.184.216.34:8080/path');
  });

  it('wraps IPv6 in brackets', () => {
    const url = new URL('https://example.com/hook');
    expect(buildIpUrl(url, '2001:db8::1')).toBe('https://[2001:db8::1]/hook');
  });

  it('wraps IPv6 with port', () => {
    const url = new URL('http://example.com:9000/hook');
    expect(buildIpUrl(url, '2001:db8::1')).toBe('http://[2001:db8::1]:9000/hook');
  });
});

// ─── OutboundWebhookService.dispatch ─────────────────────────────────────────

function makeService() {
  return new OutboundWebhookService();
}

describe('OutboundWebhookService – blocked hosts & protocols', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockLookup.mockReset();
  });

  it('silently drops on invalid URL', async () => {
    const service = makeService();
    await service.dispatch({ url: 'not-a-url', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('silently drops ftp:// scheme', async () => {
    const service = makeService();
    await service.dispatch({ url: 'ftp://example.com/hook', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('silently drops file:// scheme', async () => {
    const service = makeService();
    await service.dispatch({ url: 'file:///etc/passwd', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('silently drops localhost hostname', async () => {
    const service = makeService();
    await service.dispatch({ url: 'http://localhost/hook', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('silently drops metadata.google.internal', async () => {
    const service = makeService();
    await service.dispatch({ url: 'http://metadata.google.internal/hook', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('silently drops .local hostnames', async () => {
    const service = makeService();
    await service.dispatch({ url: 'http://myservice.local/hook', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('OutboundWebhookService – private IP blocking', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockLookup.mockReset();
  });

  it('blocks direct IPv4 private address in URL', async () => {
    const service = makeService();
    await service.dispatch({ url: 'http://192.168.1.1/hook', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('blocks AWS IMDS 169.254.169.254 directly in URL', async () => {
    const service = makeService();
    await service.dispatch({ url: 'http://169.254.169.254/latest/meta-data/', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('blocks IPv6-mapped IMDS ::ffff:169.254.169.254', async () => {
    const service = makeService();
    await service.dispatch({
      url: 'http://[::ffff:169.254.169.254]/latest/meta-data/',
      payload: {},
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('blocks CGNAT 100.100.100.200 (Alibaba IMDS) directly in URL', async () => {
    const service = makeService();
    await service.dispatch({ url: 'http://100.100.100.200/meta-data/', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('blocks hostname that resolves to private IP (DNS rebinding prevention)', async () => {
    mockLookup.mockResolvedValue([{ address: '192.168.1.100', family: 4 }]);
    const service = makeService();
    await service.dispatch({ url: 'http://evil.example.com/hook', payload: {} });
    expect(lookup).toHaveBeenCalledWith('evil.example.com', { all: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('blocks hostname that resolves to AWS IMDS (169.254.169.254)', async () => {
    mockLookup.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);
    const service = makeService();
    await service.dispatch({ url: 'http://attacker.example.com/hook', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('blocks hostname resolving to CGNAT range', async () => {
    mockLookup.mockResolvedValue([{ address: '100.64.0.1', family: 4 }]);
    const service = makeService();
    await service.dispatch({ url: 'http://sneaky.example.com/hook', payload: {} });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('OutboundWebhookService – DNS rebinding prevention', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    mockLookup.mockReset();
  });

  it('fetches using resolved IP, not original hostname', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const service = makeService();

    await service.dispatch({ url: 'http://example.com/hook', payload: { event: 'test' } });

    expect(fetch).toHaveBeenCalledOnce();
    const [calledUrl] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown];
    expect(calledUrl).toContain('93.184.216.34');
    expect(calledUrl).not.toContain('example.com');
  });

  it('passes Host header with original hostname', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const service = makeService();

    await service.dispatch({ url: 'http://example.com/hook', payload: {} });

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(options.headers['host']).toBe('example.com');
  });

  it('preserves path and query string after IP substitution', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const service = makeService();

    await service.dispatch({
      url: 'http://example.com:8080/api/v1/hook?token=abc',
      payload: {},
    });

    const [calledUrl] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown];
    expect(calledUrl).toContain('/api/v1/hook');
    expect(calledUrl).toContain('token=abc');
    expect(calledUrl).toContain(':8080');
  });

  it('wraps resolved IPv6 in brackets in URL', async () => {
    mockLookup.mockResolvedValue([{ address: '2001:db8::1', family: 6 }]);
    const service = makeService();

    await service.dispatch({ url: 'http://ipv6host.example.com/hook', payload: {} });

    const [calledUrl] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown];
    expect(calledUrl).toContain('[2001:db8::1]');
  });

  it('DNS is resolved only once per dispatch (not twice)', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const service = makeService();

    await service.dispatch({ url: 'http://example.com/hook', payload: {} });

    expect(mockLookup).toHaveBeenCalledOnce();
  });
});

describe('OutboundWebhookService – legitimate public webhooks', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    mockLookup.mockReset();
  });

  it('dispatches to public HTTP endpoint', async () => {
    mockLookup.mockResolvedValue([{ address: '1.2.3.4', family: 4 }]);
    const service = makeService();

    await service.dispatch({ url: 'http://webhook.example.com/receive', payload: { a: 1 } });

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('dispatches to public HTTPS endpoint', async () => {
    mockLookup.mockResolvedValue([{ address: '1.2.3.4', family: 4 }]);
    const service = makeService();

    await service.dispatch({ url: 'https://webhook.example.com/receive', payload: { a: 1 } });

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('sends JSON body', async () => {
    mockLookup.mockResolvedValue([{ address: '1.2.3.4', family: 4 }]);
    const service = makeService();
    const payload = { event: 'task.created', taskId: 'abc' };

    await service.dispatch({ url: 'http://webhook.example.com/hook', payload });

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { body: string },
    ];
    expect(JSON.parse(opts.body)).toEqual(payload);
  });
});
