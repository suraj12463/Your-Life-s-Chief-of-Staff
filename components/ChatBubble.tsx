// components/ChatBubble.tsx
import React from 'react';
import { MessageRole } from '../types';

interface ChatBubbleProps {
  role: MessageRole;
  content: string;
  groundingSources?: { uri: string; title: string }[];
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, content, groundingSources }) => {
  const isUser = role === MessageRole.User;
  const bubbleClasses = isUser
    ? 'bg-blue-500 text-white self-end rounded-br-none'
    : 'bg-gray-200 text-gray-800 self-start rounded-bl-none';

  return (
    <div className={`max-w-[75%] p-3 my-1 rounded-xl shadow ${bubbleClasses}`}>
      <p className="text-sm md:text-base whitespace-pre-wrap">{content}</p>
      {groundingSources && groundingSources.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-600">
          <p className="font-semibold mb-1">Sources:</p>
          <ul className="list-disc list-inside">
            {groundingSources.map((source, index) => (
              <li key={index} className="truncate">
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  title={source.title || source.uri}
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;