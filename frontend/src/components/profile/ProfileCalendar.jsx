import React, { useState, useEffect } from 'react';
    import FullCalendar from '@fullcalendar/react';
    import dayGridPlugin from '@fullcalendar/daygrid';
    import timeGridPlugin from '@fullcalendar/timegrid';
    import interactionPlugin from '@fullcalendar/interaction';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { format, parseISO } from 'date-fns';
    import { Calendar, Clock, Plus, MapPin, Trash2 } from 'lucide-react';
    
    const ProfileCalendar = ({ user }) => {
      const [events, setEvents] = useState([]);
      const [isEventModalOpen, setIsEventModalOpen] = useState(false);
      const [selectedEvent, setSelectedEvent] = useState(null);
      const [eventTitle, setEventTitle] = useState('');
      const [eventDescription, setEventDescription] = useState('');
      const [eventStart, setEventStart] = useState('');
      const [eventEnd, setEventEnd] = useState('');
      const [eventLocation, setEventLocation] = useState('');
      const { toast } = useToast();
    
      const boogasiCalendarColors = [
        'var(--calendar-event-bg)', // Default (Boogasi Blue)
        'var(--calendar-event-alt-1-bg)', // Boogasi Purple
        'var(--calendar-event-alt-2-bg)', // Boogasi Orange
        'hsl(var(--boogasi-green-val))',
        'hsl(var(--boogasi-pink-val))',
        'hsl(var(--boogasi-teal-val))',
      ];
      let colorIndex = 0;
    
      useEffect(() => {
        if (user) {
            fetchEvents();
        }
      }, [user]);
    
      const fetchEvents = async () => {
        try {
          const { data, error } = await supabase
            .from('user_notes')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'calendar_event');
          
          if (error) throw error;
          
          const formattedEvents = data.map((event, index) => ({
            id: event.id,
            title: event.title,
            start: event.content.start_date ? parseISO(event.content.start_date) : null,
            end: event.content.end_date ? parseISO(event.content.end_date) : null,
            description: event.content.description,
            location: event.content.location,
            backgroundColor: event.content.color || boogasiCalendarColors[index % boogasiCalendarColors.length], 
            borderColor: event.content.color || boogasiCalendarColors[index % boogasiCalendarColors.length] 
          })).filter(event => event.start); 
          
          setEvents(formattedEvents);
        } catch (error) {
          toast({ variant: "destructive", title: "Error fetching events", description: error.message });
        }
      };
    
      const handleDateSelect = (selectInfo) => {
        setSelectedEvent(null);
        setEventTitle('');
        setEventDescription('');
        setEventLocation('');
        setEventStart(format(selectInfo.start, "yyyy-MM-dd'T'HH:mm"));
        setEventEnd(format(selectInfo.end, "yyyy-MM-dd'T'HH:mm"));
        setIsEventModalOpen(true);
      };
    
      const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        setSelectedEvent(event);
        setEventTitle(event.title);
        setEventDescription(event.extendedProps.description || '');
        setEventLocation(event.extendedProps.location || '');
        setEventStart(format(event.start, "yyyy-MM-dd'T'HH:mm"));
        setEventEnd(event.end ? format(event.end, "yyyy-MM-dd'T'HH:mm") : '');
        setIsEventModalOpen(true);
      };
    
      const handleSaveEvent = async () => {
        if (!eventTitle.trim()) {
          toast({ variant: "destructive", title: "Event title is required." });
          return;
        }
        if (!eventStart) {
          toast({ variant: "destructive", title: "Start date and time are required." });
          return;
        }
    
        try {
          const eventColor = selectedEvent?.backgroundColor || boogasiCalendarColors[colorIndex % boogasiCalendarColors.length];
          if(!selectedEvent) colorIndex++;
    
    
          const eventData = {
            user_id: user.id,
            title: eventTitle,
            type: 'calendar_event',
            content: {
              description: eventDescription,
              start_date: new Date(eventStart).toISOString(),
              end_date: eventEnd ? new Date(eventEnd).toISOString() : new Date(new Date(eventStart).getTime() + 60 * 60 * 1000).toISOString(), 
              location: eventLocation,
              color: eventColor
            },
            updated_at: new Date().toISOString()
          };
    
          if (selectedEvent) {
            const { error } = await supabase
              .from('user_notes')
              .update(eventData)
              .eq('id', selectedEvent.id);
            if (error) throw error;
            toast({ title: "Event Updated", description: "Calendar event has been updated successfully." });
          } else {
            const { error } = await supabase
              .from('user_notes')
              .insert(eventData);
            if (error) throw error;
            toast({ title: "Event Created", description: "New calendar event has been created." });
          }
    
          setIsEventModalOpen(false);
          fetchEvents();
        } catch (error) {
          toast({ variant: "destructive", title: "Error saving event", description: error.message });
        }
      };
    
      const handleDeleteEvent = async () => {
        if (!selectedEvent || !window.confirm("Are you sure you want to delete this event?")) return;
    
        try {
          const { error } = await supabase
            .from('user_notes')
            .delete()
            .eq('id', selectedEvent.id);
          
          if (error) throw error;
          
          toast({ title: "Event Deleted", description: "Calendar event has been removed." });
          setIsEventModalOpen(false);
          fetchEvents();
        } catch (error) {
          toast({ variant: "destructive", title: "Error deleting event", description: error.message });
        }
      };
    
      return (
        <Card className="shadow-xl brighter-theme-area"> 
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-[hsl(var(--boogasi-purple-val))]">
              <Calendar className="h-5 w-5" />
              My Calendar
            </CardTitle>
            <Button 
              onClick={() => handleDateSelect({ start: new Date(), end: new Date(new Date().getTime() + 60 * 60 * 1000) })} 
              variant="default" 
              className="bg-[hsl(var(--boogasi-purple-val))] hover:bg-[hsl(var(--boogasi-purple-val))]/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] mt-4"> 
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                buttonText={{
                  today:    'Today',
                  month:    'Month',
                  week:     'Week',
                  day:      'Day',
                }}
                initialView="dayGridMonth"
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                events={events}
                select={handleDateSelect}
                eventClick={handleEventClick}
                height="100%"
                eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
                eventDisplay="block"
              />
            </div>
          </CardContent>
    
          <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
            <DialogContent className="sm:max-w-md"> 
              <DialogHeader>
                <DialogTitle className="text-[hsl(var(--boogasi-purple-val))]">{selectedEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
                <DialogDescription>
                  {selectedEvent ? 'Update the details of your event.' : 'Add a new event to your calendar.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <div className="flex items-center gap-2">
                     <MapPin className="h-4 w-4 text-[hsl(var(--boogasi-orange-val))]" />
                    <Input
                      id="location"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="e.g., Starbucks, Online"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Enter event details or notes"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start">Start Date & Time</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[hsl(var(--boogasi-teal-val))]" />
                      <Input
                        id="start"
                        type="datetime-local"
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end">End Date & Time (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[hsl(var(--boogasi-teal-val))]" />
                      <Input
                        id="end"
                        type="datetime-local"
                        value={eventEnd}
                        onChange={(e) => setEventEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2">
                {selectedEvent && (
                  <Button variant="destructive" onClick={handleDeleteEvent} className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                )}
                <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
                  <Button variant="outline" onClick={() => setIsEventModalOpen(false)} className="flex-1 sm:flex-initial">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEvent} className="flex-1 sm:flex-initial bg-[hsl(var(--boogasi-purple-val))] hover:bg-[hsl(var(--boogasi-purple-val))]/90 text-primary-foreground">
                    {selectedEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      );
    };
    
    export default ProfileCalendar;