import { useState, useRef, useEffect } from "react";
import { DefaultLayout } from "@/components/layout/DefaultLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BotIcon, Send, UserIcon } from "lucide-react";
import { GoogleGenAI } from '@google/genai';
import { Link } from 'react-router-dom';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your Personal Food Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date
    }
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = async (query: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (!apiKey) {
        return "OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.";
      }
      
      const prompt = `You are a friendly and helpful food assistant chatbot for customers.
        You help customers by answering questions about menu items, dietary preferences, nutritional information, food recommendations, and restaurant services.
        Provide personalized suggestions based on their food preferences, dietary restrictions, and taste preferences.
        Give helpful information about dining options, food ordering, delivery services, and hospitality services.
        Keep your responses clear, friendly, and customer-focused.
        Important: When providing links, just write them as plain URLs without any markdown formatting or backticks.
        User query: ${query}`;

      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'QuickTap Chatbot',
          },
          body: JSON.stringify({
            model: 'openrouter/auto',
            messages: [
              {
                role: 'system',
                content: 'You are a friendly and helpful food assistant chatbot for a restaurant ordering platform. Help customers with menu questions, recommendations, and ordering assistance. Keep responses concise and helpful.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || 'No response generated';

      // Clean up the response by removing markdown formatting
      return text
        .replace(/\*\*/g, '') // Remove double asterisks
        .replace(/\*/g, '')   // Remove single asterisks
        .replace(/`/g, '')    // Remove backticks
        .replace(/\n\*/g, '\n') // Remove asterisks at start of lines
        .trim();
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Handle rate limiting with retry delay
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        return `I'm currently experiencing high traffic. Please try again in a few moments.`;
      }

      return "I apologize, but I'm having trouble connecting to my knowledge base. Please try again later.";
    }
  };

  // OLD CODE MOVED TO GIT HISTORY - now using OpenRouter API instead of Google Gemini

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await getAIResponse(input);

      const botMessage: Message = {
        id: messages.length + 2,
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSetReminder = () => {
    setInput("Can you remind me about my next exam?");
  };

  const renderMessageText = (text: string) => {
    // Split text into words and handle line breaks
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => (
      <div key={lineIndex}>
        {line.split(' ').map((word, index) => {
          // Check if it's an external URL
          if (word.match(/^(https?:\/\/[^\s]+)/)) {
            return (
              <a
                key={index}
                href={word}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline"
              >
                {word}{' '}
              </a>
            );
          }

          // Check if it's an internal route (starts with /)
          if (word.match(/^\/[a-zA-Z0-9-]+/)) {
            return (
              <Link
                key={index}
                to={word}
                className="text-primary hover:text-primary/80 underline"
              >
                {word}{' '}
              </Link>
            );
          }

          return word + ' ';
        })}
      </div>
    ));
  };

  return (
    <DefaultLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-quicktap-creamy">Tapin</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <Card className="border shadow-md bg-quicktap-navy/5">
              <CardHeader className="bg-quicktap-navy rounded-t-lg">
                <CardTitle className="text-xl text-quicktap-lightGray">AI Food Assistant</CardTitle>
                <CardDescription className="text-quicktap-lightGray/70">
                  Ask me about menu items, food recommendations, dietary preferences, and more
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[500px] overflow-y-auto pr-4 space-y-4 bg-gray-900/50 rounded-lg p-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender === 'bot' && (
                        <Avatar className="mr-3 mt-0.5 h-8 w-8">
                          <AvatarFallback className="bg-quicktap-creamy text-quicktap-darkGray text-xs font-bold"><BotIcon /></AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2 max-w-[75%] ${message.sender === 'user'
                          ? 'bg-quicktap-lightGray text-quicktap-navy'
                          : 'bg-quicktap-navy text-quicktap-lightGray'
                          }`}
                      >
                        <p className="whitespace-pre-wrap text-sm font-medium">
                          {renderMessageText(message.text)}
                        </p>
                        <p className={`text-xs mt-1 ${message.sender === 'user'
                          ? 'opacity-70 text-quicktap-navy'
                          : 'opacity-70 text-quicktap-lightGray'
                          }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {message.sender === 'user' && (
                        <Avatar className="ml-3 mt-0.5 h-8 w-8">
                          <AvatarFallback className="bg-quicktap-teal text-quicktap-navy text-xs font-bold"><UserIcon /></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <Avatar className="mr-3 mt-0.5 h-8 w-8">
                        <AvatarFallback className="bg-quicktap-creamy text-quicktap-darkGray text-xs font-bold"><BotIcon /></AvatarFallback>
                      </Avatar>
                      <div className="bg-quicktap-navy rounded-2xl px-4 py-2">
                        <p className="text-quicktap-orange text-sm font-medium">Typing<span className="animate-pulse">...</span></p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              <CardFooter className="border-t p-4 bg-quicktap-navy/10">
                <form onSubmit={handleSendMessage} className="w-full flex gap-2">
                  <Input
                    placeholder="Ask about food, menu items, recommendations..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-quicktap-navy/20 border-quicktap-orange/30 text-quicktap-navy placeholder:text-quicktap-navy/50 focus:border-quicktap-orange"
                  />
                  <Button
                    type="submit"
                    className="bg-quicktap-orange hover:bg-quicktap-orange/90 text-quciktap-navy font-bold"
                    disabled={!input.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </div>

        </div>
      </div>
    </DefaultLayout>
  );
}
