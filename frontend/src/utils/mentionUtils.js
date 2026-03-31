const MENTION_TOKEN_REGEX = /<@([^>\s]+)>/g;

export const parseMentionParts = (content = '') => {
  if (!content) {
    return [];
  }

  const parts = [];
  let lastIndex = 0;

  content.replace(MENTION_TOKEN_REGEX, (match, userId, offset) => {
    if (offset > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, offset) });
    }

    parts.push({ type: 'mention', userId });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return parts;
};

export const replaceMentionTokens = (content = '', resolveDisplayName) => {
  if (!content) {
    return '';
  }

  return content.replace(MENTION_TOKEN_REGEX, (_, userId) => {
    const displayName = resolveDisplayName?.(userId) || 'nguoi-dung';
    return `@${displayName}`;
  });
};

export const buildMemberDirectory = (members = [], currentUser = null) => {
  const directory = {};

  if (currentUser?.id) {
    directory[currentUser.id] = {
      userId: currentUser.id,
      displayName: currentUser.displayName || currentUser.email || 'Ban',
      avatarUrl: currentUser.avatarUrl || null,
    };
  }

  members.forEach((member) => {
    if (!member?.userId) {
      return;
    }

    directory[member.userId] = {
      userId: member.userId,
      displayName: member.displayName || directory[member.userId]?.displayName || 'Thanh vien',
      avatarUrl: member.avatarUrl || directory[member.userId]?.avatarUrl || null,
    };
  });

  return directory;
};

export const createDisplayNameResolver = (directory = {}) => (userId) => {
  const matched = directory[userId];
  return matched?.displayName || userId || 'nguoi-dung';
};

export const findMentionMatch = (content = '', caretPosition = content.length) => {
  const safeCaret = Math.max(0, Math.min(caretPosition, content.length));
  const beforeCaret = content.slice(0, safeCaret);
  const match = beforeCaret.match(/(^|\s)@([^\s@<>]*)$/);

  if (!match) {
    return null;
  }

  const query = match[2] || '';
  const start = beforeCaret.length - query.length - 1;

  if (start > 0 && content[start - 1] === '<') {
    return null;
  }

  return {
    query,
    start,
    end: safeCaret,
  };
};

export const insertMentionToken = (content = '', mentionMatch, userId) => {
  if (!mentionMatch || !userId) {
    return { content, caretPosition: content.length };
  }

  const before = content.slice(0, mentionMatch.start);
  const after = content.slice(mentionMatch.end);
  const token = `<@${userId}> `;
  const nextContent = `${before}${token}${after}`;
  const nextCaretPosition = before.length + token.length;

  return {
    content: nextContent,
    caretPosition: nextCaretPosition,
  };
};

export const messageMentionsUser = (message, userId) => {
  if (!userId || !Array.isArray(message?.mentionedUserIds)) {
    return false;
  }

  return message.mentionedUserIds.includes(userId);
};
