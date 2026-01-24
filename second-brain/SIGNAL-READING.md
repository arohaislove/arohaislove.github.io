# Signal Reading Module

Background analysis of captured conversations to identify subtext, power dynamics, and communication patterns.

## Overview

The Signal Reading module analyzes captured interactions (from Undercurrent, WhatsApp, Tasker, etc.) to help you recognize patterns you might miss in real-time. It's not about critique - it's about developing pattern recognition.

## How It Works

### 1. Smart Flagging

Interactions are automatically flagged for analysis when they show:

- **Uncertainty markers** - "not sure what happened", "that was weird", "awkward"
- **Professional-ambiguous contexts** - Unclear power dynamics, networking, opportunities
- **Unanswered questions** - You asked something, then silence
- **Over-explaining** - Very long outgoing messages (>500 characters)
- **Specific keywords** - "interview", "opportunity", "feedback", "collaboration"

**Auto-excluded:**
- Transactional apps (banking, delivery, food ordering)
- Service messages
- Contacts/apps you manually exclude

### 2. Analysis Dimensions

Each flagged interaction is analyzed across 10 dimensions:

1. **Signal vs Noise** - Precise/context-aware or vague/generic?
2. **Dependency/Urgency Leak** - Does it signal stability depends on outcome?
3. **Status Calibration** - Over-explaining (insecurity) or under-explaining?
4. **Purpose Clarity** - Clear intent or processing out loud?
5. **Constraint Awareness** - Understanding of the other person's situation?
6. **What Wasn't Said** - What got avoided or talked around?
7. **Power Direction** - Who adjusted to whom? Who set the frame?
8. **Time Horizon Mismatch** - Different timescales at play?
9. **Context Carry-Over** - How does history with this person affect subtext?
10. **What Worked** - What was effective and landed well?

### 3. Context Tags

Each interaction is tagged with its context type:

- `professional-ambiguous` - Unclear rules/status (PRIMARY FOCUS)
- `operational-clear` - Defined roles, straightforward
- `personal-close` - Trusted relationships
- `transactional` - Simple exchanges

### 4. Priority Queue

Analyses are prioritized based on:

- Recency (newer = higher priority)
- Action type (`calibration-needed` > `review` > `noted`)
- Context type (`professional-ambiguous` gets boost)
- Age (items expire after 30 days or review)

### 5. Morning Briefing Integration

Top 3 unreviewed signal readings appear in your 4am briefing:

```
## Signal Reading: What You Might Have Missed 📡

**[Contact Name]** - Jan 24
- Key dynamic: [one sentence]
- Possible subtext: [one sentence]
- What worked: [one sentence]
- Pattern note: [if recurring theme]
```

### 6. Feedback Loop

After each analysis, you provide feedback:

- **Accuracy**: Yes / Partially / No
- **Your read**: What you actually thought was happening
- **Corrections**: What the analysis got wrong

Feedback is stored as calibration notes and used to improve future analyses.

## Using the System

### Dashboard

Visit `/second-brain/signals.html` to:

- Review all signal analyses
- Filter by reviewed/unreviewed
- See detailed 10-dimension breakdowns
- Provide feedback for calibration
- Track patterns over time

### API Endpoints

New endpoints in `second-brain` worker:

- `GET /signals` - Get signal queue (query: `reviewed=true/false`, `limit=N`)
- `POST /signal/:id/feedback` - Submit feedback on analysis
- `GET /signal-exclusions` - List excluded contacts/apps
- `POST /signal-exclusions` - Add exclusion (body: `{type: 'contact'|'app', value: 'name'}`)

### Data Storage

KV keys created:

- `signal:item-id` - Analysis results
- `signal-queue:all` - Priority queue of analyses
- `contact:contact-name` - Interaction history per contact
- `signal-exclusions` - Excluded contacts and apps

### Calibration Notes

Feedback creates Claude notes with category `signal-calibration`:

```javascript
{
  "category": "signal-calibration",
  "content": "User read situation X as Y, not Z - adjust for context A",
  "expiresAt": null // Never expires
}
```

These notes are included in future analysis prompts to improve accuracy.

## Privacy & Boundaries

- **No analysis without capture** - Only analyzes what you've explicitly shared
- **Manual exclusions** - Add contacts/apps to exclude list anytime
- **No notifications** - Analysis never interrupts, only appears in briefings
- **User control** - Can ignore/dismiss any analysis
- **Transactional auto-exclude** - Banking, health, delivery apps ignored by default

## Long-Term Goal

The module becomes less necessary over time as pattern recognition internalizes.

**Success** = You catch dynamics in real-time that previously required post-hoc analysis.

## Configuration

To exclude a contact from analysis:

```javascript
// Via API
fetch('https://second-brain.zammel.workers.dev/signal-exclusions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'contact',
    value: 'John Doe'
  })
});
```

Or add to the signals dashboard UI (contact exclusions interface - to be built).

## Technical Details

### Smart Flagging Algorithm

```javascript
shouldFlagForSignalAnalysis(message, direction, app, contact)
  → Check exclusions (contacts, apps, transactional patterns)
  → Check uncertainty markers (if outgoing)
  → Check professional keywords
  → Check for unanswered questions (if outgoing + contains '?')
  → Check message length (if outgoing > 500 chars)
  → Return boolean
```

### Priority Calculation

```javascript
priority = 0
priority += max(0, 48 - ageInHours)  // Recency boost
priority += 20 if action === 'calibration-needed'
priority += 10 if action === 'review'
priority += 15 if contextType === 'professional-ambiguous'
```

### Contact History Tracking

Each contact gets a history object:

```javascript
{
  "contact": "John Doe",
  "interactions": ["item-id-1", "item-id-2", ...], // Last 50
  "firstSeen": "2026-01-24T04:00:00Z",
  "lastSeen": "2026-01-24T12:30:00Z"
}
```

This enables context carry-over analysis.

## Future Enhancements

Potential additions (not yet implemented):

- **Pattern visualization** - Charts showing communication patterns over time
- **Contact insights** - Per-person pattern summaries
- **Blind spot tracking** - Aggregated view of what you consistently miss
- **Calibration dashboard** - Track analysis accuracy over time
- **Quick exclusions** - One-click exclude from signal card
- **Export signals** - Download analysis history

## Credits

Concept developed in conversation with Claude Chat.
Implementation by Claude Code.
Integrated into Second Brain system.

Built: January 2026
