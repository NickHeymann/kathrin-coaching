/* scheduling/calendar-events.js
 * Drag & Drop Event Handling | ~150 Zeilen
 */

// Drag & Drop Handling erweitern
Object.assign(ContentCalendar, {
    draggedEventId: null,

    /**
     * Drag Start
     */
    handleDragStart(event, eventId) {
        this.draggedEventId = eventId;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', eventId);

        // Visual Feedback
        event.target.classList.add('dragging');

        // Ghost Image
        const ghost = event.target.cloneNode(true);
        ghost.style.opacity = '0.7';
        document.body.appendChild(ghost);
        event.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => ghost.remove(), 0);
    },

    /**
     * Drag Over (erlaubt Drop)
     */
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        event.currentTarget.classList.add('drag-over');
    },

    /**
     * Drag Leave
     */
    handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    },

    /**
     * Drop - Event auf neues Datum verschieben
     */
    async handleDrop(event, dateStr) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');

        const eventId = this.draggedEventId;
        if (!eventId) return;

        // Datum mit Uhrzeit
        const newDate = new Date(dateStr);
        newDate.setHours(9, 0, 0, 0); // Standard: 09:00

        try {
            await SchedulerAPI.reschedulePost(eventId, newDate.toISOString());

            // Event in lokaler Liste aktualisieren
            const eventObj = this.events.find(e => e.id === eventId);
            if (eventObj) {
                eventObj.scheduled_for = newDate.toISOString();
                eventObj.status = 'scheduled';
            }

            this.render();
            this.showToast('Beitrag verschoben', 'success');

        } catch (error) {
            this.showToast('Fehler beim Verschieben', 'error');
            console.error('Reschedule error:', error);
        }

        this.draggedEventId = null;
    },

    /**
     * Toast-Nachricht anzeigen
     */
    showToast(message, type = 'info') {
        // Nutze vorhandene Toast-Funktion falls verfügbar
        if (typeof showToast === 'function') {
            showToast(message, type);
            return;
        }

        // Fallback: Eigener Toast
        const toast = document.createElement('div');
        toast.className = `calendar-toast calendar-toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});

// ==========================================
// Scheduling Modal
// ==========================================

const SchedulingModal = {
    modal: null,
    currentPost: null,

    /**
     * Modal für Scheduling öffnen
     */
    open(post, date = null) {
        this.currentPost = post;

        const html = `
            <div class="scheduling-modal-bg" onclick="SchedulingModal.close()">
                <div class="scheduling-modal" onclick="event.stopPropagation()">
                    <div class="scheduling-modal-header">
                        <h3>📅 Beitrag planen</h3>
                        <button class="close-btn" onclick="SchedulingModal.close()">×</button>
                    </div>

                    <div class="scheduling-modal-body">
                        <div class="form-group">
                            <label>Titel</label>
                            <input type="text" id="schedule-title" value="${post.title || ''}" readonly>
                        </div>

                        <div class="form-group">
                            <label>Veröffentlichungsdatum</label>
                            <input type="date" id="schedule-date"
                                   value="${date || this.getDefaultDate()}"
                                   min="${this.getTodayDate()}">
                        </div>

                        <div class="form-group">
                            <label>Uhrzeit</label>
                            <input type="time" id="schedule-time" value="09:00">
                        </div>

                        <div class="form-group">
                            <label>Notizen (optional)</label>
                            <textarea id="schedule-notes" rows="3"
                                      placeholder="Private Notizen zum Beitrag..."></textarea>
                        </div>
                    </div>

                    <div class="scheduling-modal-footer">
                        <button class="btn-ghost" onclick="SchedulingModal.saveAsDraft()">
                            Als Entwurf speichern
                        </button>
                        <button class="btn-primary" onclick="SchedulingModal.schedule()">
                            Planen
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.modal = document.querySelector('.scheduling-modal-bg');
        setTimeout(() => this.modal.classList.add('active'), 10);
    },

    /**
     * Modal schließen
     */
    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            setTimeout(() => this.modal.remove(), 300);
            this.modal = null;
        }
    },

    /**
     * Als Entwurf speichern
     */
    async saveAsDraft() {
        await this.save('draft');
    },

    /**
     * Planen
     */
    async schedule() {
        await this.save('scheduled');
    },

    /**
     * Speichern
     */
    async save(status) {
        const date = document.getElementById('schedule-date').value;
        const time = document.getElementById('schedule-time').value;
        const notes = document.getElementById('schedule-notes').value;

        const scheduledFor = status === 'scheduled'
            ? new Date(`${date}T${time}:00`).toISOString()
            : null;

        try {
            await SchedulerAPI.schedulePost({
                ...this.currentPost,
                scheduledFor,
                status,
                authorNotes: notes
            });

            ContentCalendar.showToast(
                status === 'scheduled' ? 'Beitrag geplant!' : 'Entwurf gespeichert',
                'success'
            );

            document.dispatchEvent(new Event('post-scheduled'));
            this.close();

        } catch (error) {
            ContentCalendar.showToast('Fehler beim Speichern', 'error');
        }
    },

    getDefaultDate() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    },

    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }
};

console.log('✓ scheduling/calendar-events.js geladen');
