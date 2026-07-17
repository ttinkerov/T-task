import type { WorkspaceMember } from '@/features/workspaces/types';
import { tokenizeMentions } from '../mention-utils';

interface MentionTextProps {
  text: string;
  members: WorkspaceMember[];
}

export function MentionText({ text, members }: MentionTextProps) {
  const namesById = new Map(members.map((member) => [member.userId, member.user.name]));

  return (
    <>
      {tokenizeMentions(text).map((token, index) => {
        if (token.type === 'text') {
          return <span key={`${index}-${token.value.slice(0, 8)}`}>{token.value}</span>;
        }

        const currentName = namesById.get(token.userId);
        return currentName ? (
          <span key={`${index}-${token.userId}`} className="mention-text">
            @{currentName}
          </span>
        ) : (
          <span key={`${index}-${token.userId}`}>{token.value}</span>
        );
      })}
    </>
  );
}
