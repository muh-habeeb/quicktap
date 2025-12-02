import { useState, useRef, useEffect } from "react";
import { DefaultLayout } from "@/components/layout/DefaultLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send } from "lucide-react";
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
      const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_GENAI_API_KEY });
      
      const prompt = `You are a friendly and helpful food assistant chatbot for customers.
        You help customers by answering questions about menu items, dietary preferences, nutritional information, food recommendations, and restaurant services.
        Provide personalized suggestions based on their food preferences, dietary restrictions, and taste preferences.
        Give helpful information about dining options, food ordering, delivery services, and hospitality services.
        Keep your responses clear, friendly, and customer-focused.
        Important: When providing links, just write them as plain URLs without any markdown formatting or backticks.
        User query: ${query}`;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
      });

      // Clean up the response by removing markdown formatting
      return response.text
        .replace(/\*\*/g, '') // Remove double asterisks
        .replace(/\*/g, '')   // Remove single asterisks
        .replace(/`/g, '')    // Remove backticks
        .replace(/\n\*/g, '\n') // Remove asterisks at start of lines
        .trim();
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Handle rate limiting with retry delay
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        const retryDelay = error.message.match(/retryDelay":"(\d+)s"/)?.[1] || '30';
        return `I'm currently experiencing high traffic. Please try again in ${retryDelay} seconds.`;
      }
      
      return "I apologize, but I'm having trouble connecting to my knowledge base. Please try again later.";
    }
  };
  
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
        <h1 className="text-3xl font-bold mb-8">Campus Chatbot</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Campus Assistant</CardTitle>
                <CardDescription>
                  Ask questions about courses, facilities, events, and more.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] overflow-y-auto pr-4">
                  {messages.map(message => (
                    <div 
                      key={message.id} 
                      className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender === 'bot' && (
                        <Avatar className="mr-2 mt-0.5">
                          <AvatarImage src="/placeholder.svg" alt="Bot" />
                          <AvatarFallback>YU</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div 
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">
                          {renderMessageText(message.text)}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      {message.sender === 'user' && (
                        <Avatar className="ml-2 mt-0.5">
                          <AvatarImage src="/placeholder.svg" alt="You" />
                          <AvatarFallback>YO</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <Avatar className="mr-2 mt-0.5">
                        <AvatarImage src="/placeholder.svg" alt="Bot" />
                        <AvatarFallback>YU</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <p className="text-gray-600">Typing<span className="animate-pulse">...</span></p>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              <CardFooter>
                <form onSubmit={handleSendMessage} className="w-full flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!input.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setInput("Tell me about the library hours")}
                >
                  Library Hours
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setInput("What courses are offered?")}
                >
                  Courses Info
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setInput("When is the next holiday?")}
                >
                  Holiday Schedule
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleSetReminder}
                >
                  Set Reminder
                </Button>
              </CardContent>
            </Card>
            
            {/* Recent Updates removed as requested */}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
