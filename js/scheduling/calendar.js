/* scheduling/calendar.js
 * Content-Kalender UI | ~250 Zeilen
 */

const ContentCalendar = {
    container: null,
    currentDate: new Date(),
    events: [],
    selectedDate: null,
    isLoading: false,

    /**
     * Kalender initialisieren
     */
    async init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Calendar container not found:', containerId);
            return;
        }

        await this.loadEvents();
        this.render();
        this.bindGlobalEvents();

        console.log('📅 ContentCalendar initialisiert');
    },

    /**
     * Events vom Server laden
     */
    async loadEvents() {
        this.isLoading = true;
        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth() + 1;
            this.events = await SchedulerAPI.getCalendarEvents(year, month);
        } catch (error) {
            console.warn('Events konnten nicht geladen werden:', error.message);
            this.events = [];
        }
        this.isLoading = false;
    },

    /**
     * Kalender rendern
     */
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();

        let html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="calendar-nav-btn" onclick="ContentCalendar.prevMonth()">
                        <span>◀</span>
                    </button>
                    <h3 class="calendar-title">
                        ${SCHEDULING_CONFIG.months[month]} ${year}
                    </h3>
                    <button class="calendar-nav-btn" onclick="ContentCalendar.nextMonth()">
                        <span>▶</span>
                    </button>
                    <button class="calendar-today-btn" onclick="ContentCalendar.goToToday()">
                        Heute
                    </button>
                </div>

                <div class="calendar-weekdays">
                    ${SCHEDULING_CONFIG.weekDays.map(d => `<div>${d}</div>`).join('')}
                </div>

                <div class="calendar-grid">
        `;

        // Leere Zellen vor dem 1. des Monats
        const startDay = (firstDay.getDay() + 6) % 7; // Montag = 0
        for (let i = 0; i < startDay; i++) {
            html += `<div class="calendar-cell empty"></div>`;
        }

        // Tage des Monats
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const dayEvents = this.getEventsForDate(date);
            const isToday = this.isSameDay(date, today);
            const isSelected = this.selectedDate && this.isSameDay(date, this.selectedDate);

            html += `
                <div class="calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                     data-date="${dateStr}"
                     onclick="ContentCalendar.selectDate('${dateStr}')"
                     ondrop="ContentCalendar.handleDrop(event, '${dateStr}')"
                     ondragover="ContentCalendar.handleDragOver(event)"
                     ondragleave="ContentCalendar.handleDragLeave(event)">
                    <span class="day-number">${day}</span>
                    <div class="calendar-events">
                        ${dayEvents.map(e => this.renderEvent(e)).join('')}
                    </div>
                </div>
            `;
        }

        // Leere Zellen am Ende
        const endDay = (lastDay.getDay() + 6) % 7;
        for (let i = endDay; i < 6; i++) {
            html += `<div class="calendar-cell empty"></div>`;
        }

        html += `
                </div>
                <div class="calendar-legend">
                    ${Object.entries(SCHEDULING_CONFIG.statusColors).map(([status, color]) => `
                        <span class="legend-item">
                            <span class="legend-dot" style="background: ${color}"></span>
                            ${SCHEDULING_CONFIG.statusLabels[status]}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    },

    /**
     * Einzelnes Event rendern
     */
    renderEvent(event) {
        const color = SCHEDULING_CONFIG.statusColors[event.status] || '#888';
        const title = event.title.length > 18
            ? event.title.slice(0, 18) + '...'
            : event.title;

        return `
            <div class="calendar-event"
                 style="background: ${color}"
                 draggable="true"
                 data-event-id="${event.id}"
                 ondragstart="ContentCalendar.handleDragStart(event, '${event.id}')"
                 onclick="ContentCalendar.openEvent('${event.id}', event)"
                 title="${event.title}">
                ${title}
            </div>
        `;
    },

    /**
     * Events für ein Datum filtern
     */
    getEventsForDate(date) {
        return this.events.filter(e => {
            if (!e.scheduled_for) return false;
            const eventDate = new Date(e.scheduled_for);
            return this.isSameDay(eventDate, date);
        });
    },

    // ==========================================
    // Navigation
    // ==========================================

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.loadEvents().then(() => this.render());
    },

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.loadEvents().then(() => this.render());
    },

    goToToday() {
        this.currentDate = new Date();
        this.loadEvents().then(() => this.render());
    },

    selectDate(dateStr) {
        this.selectedDate = new Date(dateStr);
        this.render();

        // Event für Blog-Editor
        const event = new CustomEvent('calendar-date-selected', {
            detail: { date: this.selectedDate }
        });
        document.dispatchEvent(event);
    },

    // ==========================================
    // Event Details
    // ==========================================

    async openEvent(eventId, clickEvent) {
        if (clickEvent) clickEvent.stopPropagation();

        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // Event für Blog-Editor
        const customEvent = new CustomEvent('calendar-event-selected', {
            detail: { event }
        });
        document.dispatchEvent(customEvent);
    },

    // ==========================================
    // Helper
    // ==========================================

    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    },

    bindGlobalEvents() {
        // Refresh nach Scheduling
        document.addEventListener('post-scheduled', () => {
            this.loadEvents().then(() => this.render());
        });
    },

    /**
     * Neues Event hinzufügen (für externe Calls)
     */
    addEvent(event) {
        this.events.push(event);
        this.render();
    },

    /**
     * Kalender neu laden
     */
    async refresh() {
        await this.loadEvents();
        this.render();
    }
};

console.log('✓ scheduling/calendar.js geladen');
