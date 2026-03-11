import { useState, useEffect } from 'react';

export type DayStatus = 'paid' | 'missed' | 'late' | 'upcoming' | 'today' | 'none';

type CalendarProps = {
    selectedDate: Date;
    onChange?: (date: Date) => void;
    dayStatuses?: Record<string, DayStatus>; // Key: YYYY-MM-DD
    mode?: 'date' | 'month' | 'status';
}

export function Calendar({ selectedDate, onChange, dayStatuses = {}, mode = 'date' }: CalendarProps) {
    const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

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
        if (mode === 'month' && onChange) {
            onChange(next);
        }
    };

    const handleDateClick = (day: number) => {
        if (mode === 'month') return;
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        if (onChange) onChange(newDate);
    };

    const isSelected = (day: number) => {
        return selectedDate.getDate() === day &&
               selectedDate.getMonth() === viewDate.getMonth() &&
               selectedDate.getFullYear() === viewDate.getFullYear();
    };

    const getStatus = (day: number): DayStatus => {
        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dayStatuses[dateStr] || 'none';
    };

    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <div className="custom-calendar" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-header">
                <button type="button" className="nav-btn" onClick={() => changeMonth(-1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div className="current-month">
                    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
                <button type="button" className="nav-btn" onClick={() => changeMonth(1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
            </div>
            
            <div className="calendar-grid">
                {weekdays.map(d => <div key={d} className="weekday-label">{d}</div>)}
                
                {days.map((day, idx) => {
                    const status = day ? getStatus(day) : 'none';
                    return (
                        <div 
                            key={idx} 
                            className={`calendar-cell ${day ? 'clickable' : 'empty'} ${day && isSelected(day) ? 'selected' : ''} status-${status}`}
                            onClick={() => day && handleDateClick(day)}
                        >
                            {day}
                            {day && status !== 'none' && <div className={`status-dot dot-${status}`}></div>}
                        </div>
                    );
                })}
            </div>

            {mode === 'status' && (
                <div className="calendar-legend" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <div className="legend-item"><span className="dot-paid"></span> Paid</div>
                    <div className="legend-item"><span className="dot-missed"></span> Missed</div>
                    <div className="legend-item"><span className="dot-late"></span> Late</div>
                    <div className="legend-item"><span className="dot-upcoming"></span> Upcoming</div>
                </div>
            )}
        </div>
    );
}
