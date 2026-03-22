"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getTodo, sendMessage } from "@/lib/api-client";
import { TodoFileUploader } from "./TodoFileUploader";
import type { TodoMessage } from "@/lib/types";

interface TodoDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  sectionType: string | null;
}

export function TodoChat({
  todoId,
  onStatusChange,
}: {
  todoId: string;
  onStatusChange: (status: "resolved" | "skipped" | "open") => void;
}) {
  const [todo, setTodo] = useState<TodoDetail | null>(null);
  const [messages, setMessages] = useState<TodoMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadChat = useCallback(async () => {
    try {
      const result = await getTodo(todoId);
      setTodo(result.todo);
      setMessages(result.messages);
    } catch (err) {
      console.error("Failed to load chat:", err);
    } finally {
      setLoading(false);
    }
  }, [todoId]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setTodo(null);
    void loadChat();
  }, [loadChat]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    // Optimistic: add user message
    const tempUserMsg: TodoMessage = {
      id: `temp-${Date.now()}`,
      todoId,
      role: "user",
      content,
      attachmentS3Keys: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendMessage(todoId, content);
      // Replace with server messages (includes both user + agent response)
      setMessages(result.messages);
      setTodo(result.todo);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }, [input, sending, todoId]);

  const handleFileUploaded = useCallback(
    (_s3Key: string, fileName: string) => {
      const fileMsg: TodoMessage = {
        id: `file-${Date.now()}`,
        todoId,
        role: "user",
        content: `Uploaded file: ${fileName}`,
        attachmentS3Keys: [_s3Key],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fileMsg]);
      setShowUploader(false);
    },
    [todoId]
  );

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!todo) return null;

  return (
    <div className="border border-gray-200 rounded-lg flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {todo.title}
        </h4>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {todo.description.replace(/\*\*/g, "").substring(0, 120)}
        </p>
        <div className="flex gap-2 mt-2">
          {todo.status !== "resolved" && (
            <button
              onClick={() => onStatusChange("resolved")}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Mark Resolved
            </button>
          )}
          {todo.status !== "skipped" && todo.status !== "resolved" && (
            <button
              onClick={() => onStatusChange("skipped")}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              Skip
            </button>
          )}
          {(todo.status === "resolved" || todo.status === "skipped") && (
            <button
              onClick={() => onStatusChange("open")}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            Ask the Advisor about this item, or upload a file.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.attachmentS3Keys && msg.attachmentS3Keys.length > 0 && (
                <div className="mt-1 text-xs opacity-75">
                  {msg.attachmentS3Keys.length} file(s) attached
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">
              Advisor is thinking...
            </div>
          </div>
        )}
      </div>

      {/* File uploader */}
      {showUploader && (
        <div className="px-3 pb-2">
          <TodoFileUploader
            todoId={todoId}
            onUploaded={handleFileUploaded}
            onCancel={() => setShowUploader(false)}
          />
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded"
            title="Upload file"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask the Advisor..."
            disabled={sending}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
