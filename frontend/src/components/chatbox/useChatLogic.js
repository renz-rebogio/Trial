import { useState, useEffect, useCallback } from 'react';
    import { useAuth } from '@/hooks/useAuth';
    import { supabase } from '@/lib/customSupabaseClient';
    import { 
      parse as dateParse, 
      format, 
      addDays, 
      nextMonday, 
      nextTuesday,
      nextWednesday,
      nextThursday,
      nextFriday,
      nextSaturday,
      nextSunday,
      startOfWeek, 
      endOfWeek, 
      isToday, 
      isTomorrow,
      setHours,
      setMinutes,
      setSeconds,
      isValid
    } from 'date-fns';
    import * as dateFnsTz from 'date-fns-tz';
    
    const useChatLogic = (onCloseChatbox) => {
      const { user } = useAuth();
      const [userName, setUserName] = useState("Valued User");
      const [messages, setMessages] = useState([]);
      const [inputText, setInputText] = useState('');
      const [isLoading, setIsLoading] = useState(false);
    
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const financialDisclaimer = "\n\nRemember: This is research and info only, not financial advice.";
    
      useEffect(() => {
        if (user && user.user_metadata) {
          setUserName(user.user_metadata.screen_name || user.user_metadata.name || "Valued User");
        } else {
          setUserName("Valued User");
        }
      }, [user]);
    
      const addMessage = useCallback((newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      }, []);
    
      const parseDateTimeAndLocation = (text) => {
        let date = new Date();
        let location = null;
        let titleCandidate = text;
    
        const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
        const timeMatch = text.match(timeRegex);
    
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
          const ampm = timeMatch[3]?.toLowerCase();
    
          if (ampm === 'pm' && hours < 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          
          date = setHours(date, hours);
          date = setMinutes(date, minutes);
          date = setSeconds(date, 0);
          titleCandidate = titleCandidate.replace(timeMatch[0], '').trim();
        } else {
          date = setHours(date, 9); 
          date = setMinutes(date, 0);
          date = setSeconds(date, 0);
        }
        
        const dayMatchers = [
          { regex: /tomorrow/i, setter: (d) => addDays(d, 1) },
          { regex: /today/i, setter: (d) => d },
          { regex: /next monday/i, setter: nextMonday },
          { regex: /next tuesday/i, setter: nextTuesday },
          { regex: /next wednesday/i, setter: nextWednesday },
          { regex: /next thursday/i, setter: nextThursday },
          { regex: /next friday/i, setter: nextFriday },
          { regex: /next saturday/i, setter: nextSaturday },
          { regex: /next sunday/i, setter: nextSunday },
          { regex: /monday/i, setter: nextMonday, isSpecificDay: true },
          { regex: /tuesday/i, setter: nextTuesday, isSpecificDay: true },
          { regex: /wednesday/i, setter: nextWednesday, isSpecificDay: true },
          { regex: /thursday/i, setter: nextThursday, isSpecificDay: true },
          { regex: /friday/i, setter: nextFriday, isSpecificDay: true },
          { regex: /saturday/i, setter: nextSaturday, isSpecificDay: true },
          { regex: /sunday/i, setter: nextSunday, isSpecificDay: true },
        ];
    
        let dayMatched = false;
        for (const matcher of dayMatchers) {
          if (text.match(matcher.regex)) {
            date = matcher.setter(date);
            titleCandidate = titleCandidate.replace(matcher.regex, '').trim();
            dayMatched = true;
            if (matcher.isSpecificDay && !timeMatch) {
               date = setHours(date, 9); 
            }
            break;
          }
        }
        
        const datePatternMatch = text.match(/(\d{1,2}\/\d{1,2}(\/\d{2,4})?)/);
        if (datePatternMatch && !dayMatched) {
            const dateStr = datePatternMatch[0];
            const parsedD = dateParse(dateStr, text.includes('/') ? (dateStr.split('/')[2] ? 'M/d/yy' : 'M/d') : 'M/d', new Date());
            if(isValid(parsedD)){
                date = setHours(setMinutes(setSeconds(parsedD, date.getSeconds()), date.getMinutes()), date.getHours());
                titleCandidate = titleCandidate.replace(dateStr, '').trim();
            }
        }
    
        const atLocationRegex = /at\s+([a-zA-Z0-9\s]+)(?:on|tomorrow|today|next|$)/i;
        const locationMatch = text.match(atLocationRegex);
        if (locationMatch && locationMatch[1]) {
            location = locationMatch[1].trim();
            const cleanedTitleCandidate = titleCandidate.replace(new RegExp(`at\\s+${location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'), '').trim();
            if (cleanedTitleCandidate.length > 0) {
                 titleCandidate = cleanedTitleCandidate;
            }
        }
    
        if (!isValid(date)) return { date: null, location: null, titleCandidate: text };
        
        const zonedDate = dateFnsTz.utcToZonedTime(date, timeZone);
        const finalDate = dateFnsTz.zonedTimeToUtc(zonedDate, timeZone).toISOString();
        
        titleCandidate = titleCandidate.replace(/add to calendar:?/i, '').replace(/schedule event:?/i, '').replace(/schedule meeting:?/i, '').replace(/book meeting:?/i, '').trim();
        titleCandidate = titleCandidate.replace(/,$/, '').trim();
    
        return { date: finalDate, location, titleCandidate: titleCandidate || "Meeting" };
      };
    
      const handleAddNote = async (text) => {
        if (!user) {
          addMessage({ id: Date.now(), sender: 'ai', text: "You need to be logged in to add notes." });
          return;
        }
        const noteContentMatch = text.match(/(?:add|create|new) note:?\s*(.*)/i);
        const content = noteContentMatch ? noteContentMatch[1].trim() : text.replace(/(?:add|create|new) note/i, "").trim();
        
        if (!content) {
          addMessage({ id: Date.now(), sender: 'ai', text: "What would you like the note to say?" });
          return;
        }
    
        const { data, error } = await supabase
          .from('user_notes')
          .insert({
            user_id: user.id,
            title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            content: { text: content },
            type: 'note'
          })
          .select();
    
        if (error) {
          addMessage({ id: Date.now(), sender: 'ai', text: `Sorry, I couldn't save your note: ${error.message}` });
        } else {
          addMessage({ id: Date.now(), sender: 'ai', text: `✅ Okay, I've added a note: "${data[0].title}"` });
        }
      };
    
      const handleScheduleEvent = async (text) => {
        if (!user) {
          addMessage({ id: Date.now(), sender: 'ai', text: "You need to be logged in to schedule events." });
          return;
        }
    
        const { date: extractedDate, location, titleCandidate } = parseDateTimeAndLocation(text);
    
        if (!extractedDate) {
          addMessage({ id: Date.now(), sender: 'ai', text: "🤔 I almost got that! Could you tell me what day/time the meeting is? For example: 'Schedule meeting for tomorrow at 2 PM'." });
          return;
        }
        
        const title = titleCandidate || "Meeting";
        const startDate = extractedDate;
        const endDate = format(addDays(new Date(extractedDate), 0), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx").replace(/\d{2}:\d{2}:\d{2}/, format(new Date(new Date(extractedDate).getTime() + 60 * 60 * 1000), 'HH:mm:ss'));
    
        const eventContent = { 
          description: title, 
          start_date: startDate, 
          end_date: endDate, 
          color: '#0052A4' 
        };
    
        if (location) {
          eventContent.location = location;
        }
    
        const { data, error } = await supabase
          .from('user_notes')
          .insert({
            user_id: user.id,
            title: title,
            content: eventContent,
            type: 'calendar_event'
          })
          .select();
    
        if (error) {
          addMessage({ id: Date.now(), sender: 'ai', text: `Sorry, I couldn't schedule your event: ${error.message}` });
        } else {
          let confirmationMessage = `✅ Got it! I’ve added "${data[0].title}" to your calendar for ${format(new Date(startDate), 'EEEE, MMM d \'at\' h:mm a')}.`;
          if (location) {
            confirmationMessage += ` The location is set to "${location}".`;
          }
          addMessage({ id: Date.now(), sender: 'ai', text: confirmationMessage });
        }
      };
    
      const handleViewCalendar = async (text) => {
        if (!user) {
          addMessage({ id: Date.now(), sender: 'ai', text: "You need to be logged in to view your calendar." });
          return;
        }
        
        let startDate, endDate;
        const today = new Date();
        if (text.match(/this week/i)) {
          startDate = startOfWeek(today, { weekStartsOn: 1 });
          endDate = endOfWeek(today, { weekStartsOn: 1 });
        } else if (text.match(/today/i)) {
          startDate = today;
          endDate = today;
        } else {
          startDate = startOfWeek(today, { weekStartsOn: 1 });
          endDate = endOfWeek(today, { weekStartsOn: 1 });
        }
    
        const { data, error } = await supabase
          .from('user_notes')
          .select('title, content')
          .eq('user_id', user.id)
          .eq('type', 'calendar_event')
          .gte('content->>start_date', startDate.toISOString())
          .lte('content->>start_date', endDate.toISOString())
          .order('content->>start_date', { ascending: true });
    
        if (error) {
          addMessage({ id: Date.now(), sender: 'ai', text: `Sorry, I couldn't fetch your calendar events: ${error.message}` });
        } else if (data.length === 0) {
          addMessage({ id: Date.now(), sender: 'ai', text: "You have no events scheduled for this period." });
        } else {
          let responseText = "Here are your upcoming events:\n";
          data.forEach(event => {
            responseText += `- ${event.title} on ${format(new Date(event.content.start_date), 'MMM d, h:mm a')}`;
            if (event.content.location) {
              responseText += ` at ${event.content.location}`;
            }
            responseText += '\n';
          });
          addMessage({ id: Date.now(), sender: 'ai', text: responseText.trim() });
        }
      };
      
      const handleDeleteNote = async (text) => {
        if (!user) {
          addMessage({ id: Date.now(), sender: 'ai', text: "You need to be logged in to delete notes." });
          return;
        }
        const keywordMatch = text.match(/(?:delete|remove) (?:note|event) (?:about|called|titled|with) ['"]?(.*?)['"]?/i) || text.match(/(?:delete|remove) (?:the )?(?:note|event) (.*)/i);
        const keywords = keywordMatch ? keywordMatch[1].trim().toLowerCase() : null;
    
        if (!keywords) {
          addMessage({ id: Date.now(), sender: 'ai', text: "Which note or event would you like to delete? Please specify some keywords from its title." });
          return;
        }
    
        const { data, error: fetchError } = await supabase
          .from('user_notes')
          .select('id, title, type')
          .eq('user_id', user.id)
          .or('type.eq.note,type.eq.calendar_event')
          .ilike('title', `%${keywords}%`);
          
        if (fetchError) {
          addMessage({ id: Date.now(), sender: 'ai', text: `Error finding note/event: ${fetchError.message}` });
          return;
        }
    
        if (data.length === 0) {
          addMessage({ id: Date.now(), sender: 'ai', text: `I couldn't find a note or event with keywords "${keywords}".` });
          return;
        }
        
        if (data.length > 1) {
           addMessage({ id: Date.now(), sender: 'ai', text: `I found multiple items matching "${keywords}". Please be more specific or delete from your profile page.` });
          return;
        }
    
        const itemToDelete = data[0];
        const { error: deleteError } = await supabase
          .from('user_notes')
          .delete()
          .eq('id', itemToDelete.id);
    
        if (deleteError) {
          addMessage({ id: Date.now(), sender: 'ai', text: `Sorry, I couldn't delete the ${itemToDelete.type}: ${deleteError.message}` });
        } else {
          addMessage({ id: Date.now(), sender: 'ai', text: `Okay, I've deleted the ${itemToDelete.type.replace('_', ' ')} titled "${itemToDelete.title}".` });
        }
      };
    
      const simulateAIResponse = (userInput, isFinancialQuery = false) => {
        setIsLoading(true);
        const lowerInput = userInput.toLowerCase();
        let finalAiText = "";
        
        if (lowerInput.includes("add note") || lowerInput.includes("create note") || lowerInput.includes("new note")) {
          handleAddNote(userInput);
          setIsLoading(false);
          return;
        } else if (lowerInput.includes("add to calendar") || lowerInput.includes("schedule event") || lowerInput.includes("schedule meeting") || lowerInput.includes("book meeting") || lowerInput.includes("add event")) {
          handleScheduleEvent(userInput);
          setIsLoading(false);
          return;
        } else if (lowerInput.includes("what's on my calendar") || lowerInput.includes("show my calendar") || lowerInput.includes("my events")) {
          handleViewCalendar(userInput);
          setIsLoading(false);
          return;
        } else if (lowerInput.includes("delete note") || lowerInput.includes("remove note") || lowerInput.includes("delete event") || lowerInput.includes("remove event")) {
          handleDeleteNote(userInput);
          setIsLoading(false);
          return;
        } else {
          setTimeout(() => {
            let aiText = "";
            const researchDisclaimer = "In Research Mode: ";
    
            if (lowerInput.includes("learn about verified supporters") || lowerInput.includes("verified supporters")) {
              aiText = `Verified Supporters on Boogasi are individuals or organizations who have completed a verification process to demonstrate their capacity and intent to support projects or investments within our network. This helps build trust and transparency. You can learn more about the verification process on your profile page.`;
            } else if (lowerInput.includes("explore current listings") || lowerInput.includes("current listings")) {
              aiText = `You can explore current listings for investment opportunities, products, or services in the "Marketplace" section of Boogasi. Listings are provided by members and may include custom-built solutions or unique offerings exclusive to our network.`;
            } else if (lowerInput.includes("understand boogasi ai tools") || lowerInput.includes("ai tools")) {
              aiText = `Boogasi offers AI-powered tools like the "AI Finance Assistant" and "My Investments AI". These tools are designed for research, data analysis, and informational insights. They simulate AI capabilities and should not be used for financial decision-making. For example, the AI Finance Assistant can help analyze uploaded financial documents (conceptually) to provide summaries and identify trends.`;
            } else if (isFinancialQuery || lowerInput.includes("financial question")) {
              aiText = `${researchDisclaimer}I can provide general information based on market research. For example, diversification is a common strategy to manage investment risk. It involves spreading investments across various asset classes. However, specific advice depends on individual circumstances.`;
              aiText += financialDisclaimer;
            } else if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
              aiText = `Hello ${userName}! How can I assist you today on the Boogasi platform?`;
            } else {
              aiText = `I can help with information about Boogasi's platform, features, and provide general research. For specific financial advice, please consult a licensed professional. How can I assist you further?`;
            }
            
            addMessage({ id: Date.now(), sender: 'ai', text: aiText });
            setIsLoading(false);
          }, 1000 + Math.random() * 1000);
        }
      };
    
      const handleSendMessage = (text) => {
        if (!text.trim()) return;
        addMessage({ id: Date.now(), sender: 'user', text });
        setInputText('');
        
        const financialKeywords = ["invest", "stock", "crypto", "buy shares", "financial advice", "portfolio", "risk", "return", "profit", "market"];
        const isFinancial = financialKeywords.some(keyword => text.toLowerCase().includes(keyword)) || text.toLowerCase().includes("financial question");
        
        simulateAIResponse(text, isFinancial);
      };
    
      const handleQuickAction = (actionType, actionText) => {
        addMessage({ id: Date.now(), sender: 'user', text: actionText });
        if (actionType === "ask_financial_question") {
          simulateAIResponse(actionText, true);
        } else {
          simulateAIResponse(actionText, false);
        }
      };
      
      return {
        messages,
        inputText,
        setInputText,
        isLoading,
        handleSendMessage,
        handleQuickAction,
        addMessage,
        userName,
      };
    };
    
    export default useChatLogic;