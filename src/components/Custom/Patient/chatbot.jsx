import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [step, setStep] = useState('initial'); // 'initial', 'topics', 'questions'
  const [currentTopic, setCurrentTopic] = useState(null);
  const chatEndRef = useRef(null);

  const topics = [
    'Bookings & Appointments',
    'Services Offered',
    'Visiting Hours',
    'Hospital Location & Directions',
    'Opening Hours',
    'Emergency Contact',
    'FAQs',
    'Call Hotline'
  ];

  const responses = {
    'bookings & appointments': {
      questions: [
        'How do I book an appointment?',
        'What is the appointment hotline?'
      ],
      answers: {
        'How do I book an appointment?': 'You can book an appointment online through our website or by visiting our reception. Simply select your preferred doctor and time slot. For assistance, contact our staff.',
        'What is the appointment hotline?': 'Our appointment hotline number is 1990. Feel free to call us between 8 AM and 6 PM for support.'
      }
    },
    'services offered': {
      questions: [
        'Do you have laboratory and scanning facilities?',
        'Is there a pharmacy?'
      ],
      answers: {
        'Do you have laboratory and scanning facilities?': 'Yes, we offer state-of-the-art laboratory and scanning facilities including X-rays, MRIs, and blood tests, available daily from 7 AM to 7 PM.',
        'Is there a pharmacy?': 'Yes, we have an on-site pharmacy open from 8 AM to 8 PM, providing a wide range of medications.'
      }
    },
    'visiting hours': {
      questions: [
        'When can I visit a patient?',
        'Are there any restrictions for visitors?'
      ],
      answers: {
        'When can I visit a patient?': 'Visiting hours are from 4 PM to 7 PM daily. Please check with the ward for any changes.',
        'Are there any restrictions for visitors?': 'Yes, visitors are limited to two per patient, and children under 12 are not allowed. Masks are mandatory.'
      }
    },
    'hospital location & directions': {
      questions: [
        'Where is the hospital located?',
        'How do I get there?'
      ],
      answers: {
        'Where is the hospital located?': 'We are located at 456 Health Avenue, Colombo 5, Sri Lanka.',
        'How do I get there?': 'You can reach us by bus (route 138), train to Colombo Fort and a short taxi ride, or by car via the A2 highway. Parking is available.'
      }
    },
    'opening hours': {
      questions: [
        'What are your working hours?',
        'Is the hospital open on Sundays?'
      ],
      answers: {
        'What are your working hours?': 'Our hospital operates from 7 AM to 10 PM, Monday to Saturday.',
        'Is the hospital open on Sundays?': 'Yes, we are open on Sundays from 8 AM to 6 PM for emergencies and limited services.'
      }
    },
    'emergency contact': {
      questions: [
        'What number should I call in an emergency?',
        'Do you have ambulance services?'
      ],
      answers: {
        'What number should I call in an emergency?': 'Please call 1990 for emergencies, available 24/7.',
        'Do you have ambulance services?': 'Yes, we provide 24/7 ambulance services. Call 1990 to request one.'
      }
    },
    'faqs': {
      questions: [
        'Do you accept credit cards?',
        'Do you have wheelchair access?',
        'Can I reschedule my appointment?'
      ],
      answers: {
        'Do you accept credit cards?': 'Yes, we accept all major credit cards at our payment counters.',
        'Do you have wheelchair access?': 'Yes, our facility is fully wheelchair accessible with ramps and elevators.',
        'Can I reschedule my appointment?': 'Yes, you can reschedule by calling 1990 or through our online portal up to 24 hours before your appointment.'
      }
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setMessages(prev => [...prev, { text: inputMessage, sender: 'user' }]);
    setInputMessage('');

    if (step === 'initial') {
      setMessages(prev => [...prev, { text: 'Please select a topic:', sender: 'bot', options: topics }]);
      setStep('topics');
    } else if (step === 'topics') {
      const topic = topics.find(t => t.toLowerCase() === inputMessage.toLowerCase().replace(/ & /g, ' '));
      if (topic) {
        setCurrentTopic(topic);
        displayQuestions(topic);
      } else if (inputMessage.toLowerCase() === 'call hotline') {
        window.location.href = 'tel:1990';
      } else {
        setMessages(prev => [...prev, { text: 'Topic not recognized. Please select from the list:', sender: 'bot', options: topics }]);
      }
    } else if (step === 'questions') {
      const newTopic = topics.find(t => t.toLowerCase() === inputMessage.toLowerCase().replace(/ & /g, ' '));
      if (newTopic) {
        setCurrentTopic(newTopic);
        displayQuestions(newTopic);
      } else {
        const answers = responses[currentTopic.toLowerCase().replace(/ & /g, ' ')]?.answers || {};
        const answer = answers[inputMessage] || 'Sorry, no specific answer available for this question.';
        setMessages(prev => [...prev, { text: answer, sender: 'bot' }]);
        displayQuestions(currentTopic);
      }
    }
  };

  const displayQuestions = (topic) => {
    const questions = responses[topic.toLowerCase().replace(/ & /g, ' ')]?.questions || [];
    if (questions.length > 0) {
      setMessages(prev => [...prev, { text: `Selected topic: ${topic}`, sender: 'bot' }]);
      setMessages(prev => [...prev, { text: `Questions under ${topic}:`, sender: 'bot', options: [...questions, 'Back'] }]);
      setStep('questions');
    } else {
      setMessages(prev => [...prev, { text: `No questions available for ${topic}.`, sender: 'bot', options: ['Back'] }]);
      setStep('questions');
    }
  };

  const handleOptionSelect = (option) => {
    if (step === 'initial' || step === 'topics') {
      if (option.toLowerCase() === 'call hotline') {
        window.location.href = 'tel:1990';
        return;
      }
      setCurrentTopic(option);
      displayQuestions(option);
    } else if (step === 'questions') {
      if (option.toLowerCase() === 'back') {
        setMessages(prev => [...prev, { text: 'Returning to topics...', sender: 'bot' }]);
        setMessages(prev => [...prev, { text: 'Please select a topic:', sender: 'bot', options: topics }]);
        setCurrentTopic(null);
        setStep('topics');
      } else {
        const answers = responses[currentTopic.toLowerCase().replace(/ & /g, ' ')]?.answers || {};
        const answer = answers[option] || 'Sorry, no specific answer available for this question.';
        setMessages(prev => [...prev, { text: option, sender: 'user' }]);
        setMessages(prev => [...prev, { text: answer, sender: 'bot' }]);
        displayQuestions(currentTopic); // Redisplay questions after answer
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessages([]);
    setInputMessage('');
    setStep('initial');
    setCurrentTopic(null);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Chat Icon */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition"
      >
        <MessageSquare size={24} />
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Chat with Us</h3>
            <Button onClick={handleClose} variant="ghost" className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </Button>
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-2" ref={chatEndRef}>
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {message.text}
                  {message.options && (
                    <div className="mt-2 space-y-1">
                      {message.options.map((opt, i) => (
                        <Button
                          key={i}
                          onClick={() => handleOptionSelect(opt)}
                          className="w-full text-left bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 p-2 border rounded"
                placeholder="Type a message..."
              />
              <Button
                onClick={handleSendMessage}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;