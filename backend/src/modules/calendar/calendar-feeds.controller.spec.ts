import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicCalendarFeedsController } from './calendar-feeds.controller';

function makeResponse() {
  const response = {
    status: vi.fn(),
    set: vi.fn(),
    send: vi.fn(),
    end: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.set.mockReturnValue(response);
  response.send.mockReturnValue(response);
  response.end.mockReturnValue(response);
  return response;
}

describe('PublicCalendarFeedsController', () => {
  const lastModified = new Date('2026-07-17T01:00:00.456Z');
  let service: { getCalendar: ReturnType<typeof vi.fn> };
  let controller: PublicCalendarFeedsController;

  beforeEach(() => {
    service = {
      getCalendar: vi.fn().mockResolvedValue({
        content: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n',
        lastModified,
      }),
    };
    controller = new PublicCalendarFeedsController(service as never);
  });

  it('returns 304 when the client already has the latest feed version', async () => {
    const response = makeResponse();

    await controller.getCalendar(
      'A'.repeat(43),
      { headers: { 'if-modified-since': 'Fri, 17 Jul 2026 01:00:00 GMT' } } as never,
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(304);
    expect(response.end).toHaveBeenCalledOnce();
    expect(response.send).not.toHaveBeenCalled();
  });

  it('returns iCalendar content with private revalidation headers', async () => {
    const response = makeResponse();

    await controller.getCalendar('A'.repeat(43), { headers: {} } as never, response as never);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'private, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
      }),
    );
    expect(response.send).toHaveBeenCalledWith('BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n');
  });
});
