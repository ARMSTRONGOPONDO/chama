import { useState, useEffect } from 'react';

type CalendarProps = {
    selectedDate: Date;
    onChange: (date: Date) => void;
    indicators?: { date: Date; color?: string }[];
    mode?: 'date' | 'month';
}

export function Calendar({ selectedDate, onChange, indicators = [], mode = 'date' }: CalendarProps) {
    // Initialize viewDate based on selectedDate
    const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    // Sync viewDate when selectedDate changes externally
    useEffect(() => {
        setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }, [selectedDate]);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const changeMonth = (offset: number) => {
        const next = new Date(viewDate);
        next.setMonth(next.getMonth() + offset);
        setViewDate(next);
        
        // In month mode, the "view" IS the selection
        if (mode === 'month') {
            onChange(next);
        }
    };

    const handleDateClick = (day: number) => {
        if (mode === 'month') return;
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onChange(newDate);
    };

    const isSelected = (day: number) => {
        return selectedDate.getDate() === day &&
               selectedDate.getMonth() === viewDate.getMonth() &&
               selectedDate.getFullYear() === viewDate.getFullYear();
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day &&
               today.getMonth() === viewDate.getMonth() &&
               today.getFullYear() === viewDate.getFullYear();
    };

    const hasIndicator = (day: number) => {
        return indicators.some(ind => {
            const d = new Date(ind.date);
            return d.getDate() === day &&
                   d.getMonth() === viewDate.getMonth() &&
                   d.getFullYear() === viewDate.getFullYear();
        });
    };

    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <div className="custom-calendar" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-header">
                <button type="button" className="nav-btn" onClick={() => changeMonth(-1)} title="Previous Month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div className="current-month">
                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
                <button type="button" className="nav-btn" onClick={() => changeMonth(1)} title="Next Month">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
            </div>
            
            <div className="calendar-grid">
                {weekdays.map(d => <div key={d} className="weekday-label">{d}</div>)}
                
                {days.map((day, idx) => (
                    <div 
                        key={idx} 
                        className={`calendar-cell ${day ? 'clickable' : 'empty'} ${day && isSelected(day) ? 'selected' : ''} ${day && isToday(day) ? 'today' : ''}`}
                        onClick={() => day && handleDateClick(day)}
                    >
                        {day}
                        {day && hasIndicator(day) && <div className="indicator-dot"></div>}
                    </div>
                ))}
            </div>

            <div className="calendar-footer">
                <button 
                    type="button" 
                    className="today-btn" 
                    onClick={() => {
                        const now = new Date();
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        setViewDate(startOfMonth);
                        onChange(now);
                    }}
                >
                    Today
                </button>
            </div>
        </div>
    );
}
