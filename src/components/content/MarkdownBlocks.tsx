import React from 'react';
import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; rows: string[][] }
  | { type: 'spacer' };

function parseTable(lines: string[]): string[][] {
  const rows: string[][] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    if (trimmed.includes('---')) continue;
    const cells = trimmed
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

function tokenize(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: 'spacer' });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const rows = parseTable(tableLines);
      blocks.push({ type: 'table', rows });
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      blocks.push({ type: 'heading', text: trimmed.replace(/^###\s+/, '') });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      let quoteText = trimmed.slice(2);
      i += 1;
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteText += ' ' + lines[i].trim().slice(2);
        i += 1;
      }
      blocks.push({ type: 'blockquote', text: quoteText });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    blocks.push({ type: 'paragraph', text: line });
    i += 1;
  }

  return blocks;
}

// Clean inline key-value pairs for metadata (Citation, Objective, etc.)
function renderParagraphContent(text: string) {
  const labelMatch = text.match(/^\*\*(.*?):\*\*\s*(.*)/);

  if (labelMatch) {
    const [, label, content] = labelMatch;
    return (
      <div className="py-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {label}
        </div>
        <div className="text-slate-700">
          {renderInlineContent(content)}
        </div>
      </div>
    );
  }

  return renderInlineContent(text);
}

function renderInlineContent(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    const italicParts = part.split(/(\*.*?\*)/g);
    if (italicParts.length > 1) {
      return italicParts.map((subPart, subIdx) => {
        if (subPart.startsWith('*') && subPart.endsWith('*')) {
          return <em key={`${idx}-${subIdx}`} className="italic text-slate-600">{subPart.slice(1, -1)}</em>;
        }
        return <React.Fragment key={`${idx}-${subIdx}`}>{renderLink(subPart)}</React.Fragment>;
      });
    }

    return <React.Fragment key={idx}>{renderLink(part)}</React.Fragment>;
  });
}

function renderLink(text: string) {
  const linkMatch = text.match(/\[(.*?)\]\((.*?)\)/);
  if (linkMatch) {
    const [full, label, url] = linkMatch;
    const splitByLink = text.split(full);
    return (
      <>
        {splitByLink[0]}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-700 underline underline-offset-2 decoration-purple-200 hover:decoration-purple-400 transition-colors"
        >
          {label}
          <ExternalLink className="inline w-3 h-3 ml-0.5 opacity-50" />
        </a>
        {splitByLink[1]}
      </>
    );
  }
  return text;
}

export function MarkdownBlocks({ lines }: { lines: string[] }) {
  const blocks = tokenize(lines);

  return (
    <div className="text-slate-600 leading-relaxed text-[15px] antialiased">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'spacer':
            return <div key={idx} className="h-2" />;

          case 'heading':
            return (
              <h3 key={idx} className="text-base font-semibold text-slate-800 mt-3 mb-1">
                {block.text}
              </h3>
            );

          case 'blockquote':
            return (
              <blockquote key={idx} className="my-2 pl-4 border-l-2 border-slate-200 text-slate-600 italic">
                {renderInlineContent(block.text)}
              </blockquote>
            );

          case 'paragraph':
            const content = renderParagraphContent(block.text);
            if (React.isValidElement(content)) {
              return <React.Fragment key={idx}>{content}</React.Fragment>;
            }
            return (
              <p key={idx} className="mb-2 last:mb-0">
                {content}
              </p>
            );

          case 'ul':
            return (
              <ul key={idx} className="my-2 space-y-1.5 pl-4">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-[7px] shrink-0"></span>
                    <span className="flex-1">{renderInlineContent(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={idx} className="my-2 space-y-1.5 pl-4">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-slate-700">
                    <span className="text-purple-500 font-semibold text-sm tabular-nums shrink-0 w-5">
                      {itemIdx + 1}.
                    </span>
                    <span className="flex-1">{renderInlineContent(item)}</span>
                  </li>
                ))}
              </ol>
            );

          case 'table':
            if (block.rows.length === 0) return null;
            const [header, ...body] = block.rows;
            return (
              <div key={idx} className="my-3 overflow-hidden rounded-lg border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <tr>
                        {header.map((cell, cellIdx) => (
                          <th
                            key={cellIdx}
                            className="px-4 py-3 font-semibold text-xs uppercase tracking-wide whitespace-nowrap"
                          >
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {body.map((row, rowIdx) => (
                        <tr key={rowIdx} className="bg-white hover:bg-slate-50/50 transition-colors">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className={clsx(
                              "px-4 py-3",
                              cellIdx === 0 ? "font-medium text-slate-900" : "text-slate-600 tabular-nums"
                            )}>
                              {renderInlineContent(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
