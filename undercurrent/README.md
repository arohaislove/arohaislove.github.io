# Undercurrent

**Messaging with X-Ray Vision**

A two-person messaging web app where conversations are analyzed in real-time using multiple psychological and linguistic frameworks. Both participants see the same analysis overlays, revealing the dynamics beneath the surface conversation.

## Concept

Think of it as "texting with depth" - the surface conversation looks like normal messaging, but both users can toggle an "analysis lens" that reveals:

- **Transactional Analysis**: What ego state is speaking (Parent, Adult, Child)?
- **Speech Acts**: What is this message doing (requesting, promising, complaining)?
- **Discourse Patterns**: How is the conversation being managed?
- **Power Dynamics**: Who's positioning themselves up, down, or level?
- **Subtext**: What's really happening beneath the words?

## Features

- **Simple conversation creation**: Generate a unique link and share with one other person
- **Real-time messaging**: Messages poll every 4 seconds for updates
- **Analysis lens toggle**: Choose when to view the psychological layer
- **Color-coded ego states**: Visual indicators for Parent (warm), Adult (neutral), Child (cool)
- **Expandable analysis**: Tap any message to see full framework breakdown
- **Mobile-first design**: Clean, dark interface optimized for phones
- **No accounts required**: Just set a display name and start chatting

## How to Use

### Starting a Conversation

1. Visit https://arohaislove.github.io/undercurrent/
2. Click "Start New Conversation"
3. Set your display name
4. Share the URL with one other person

### Joining a Conversation

1. Open the shared link
2. Set your display name
3. Start chatting

### Using the Analysis Lens

1. Click "Enable Lens" in the header
2. Messages now show color-coded indicators
3. Tap any message to expand full analysis
4. Tap again to collapse

## Technical Stack

- **Frontend**: Single-page PWA (HTML/CSS/JS)
- **Backend**: Cloudflare Worker with D1 database
- **Analysis**: Claude 3.5 Sonnet via Anthropic API
- **Hosting**: GitHub Pages

## Architecture

```
User Browser ←→ GitHub Pages (Static HTML)
                      ↓
                Cloudflare Worker API
                      ↓
              ┌───────┴────────┐
              ↓                ↓
         D1 Database    Claude API
         (Messages)     (Analysis)
```

## Setup for Development

See `workers/undercurrent-api/README.md` for backend setup instructions.

Frontend setup is simple - just open `index.html` in a browser and update the `API_URL` constant to point to your deployed worker.

## Analysis Frameworks

### Transactional Analysis
Based on Eric Berne's model of ego states:
- **Parent**: Nurturing or Critical
- **Adult**: Rational, objective
- **Child**: Free or Adapted

### Speech Act Theory
Following Austin and Searle:
- **Assertive**: Stating facts
- **Directive**: Getting someone to do something
- **Commissive**: Committing to action
- **Expressive**: Expressing feelings
- **Declarative**: Creating reality through words

### Discourse Analysis
Looking at conversation management:
- Topic control (initiating, maintaining, yielding, competing)
- Markers (hedging, topic shifts, repairs, interruptions)

### Power Dynamics
Inspired by relational communication theory:
- **One-up**: Asserting dominance or expertise
- **One-down**: Yielding, submitting, requesting
- **Level**: Equal, collaborative

## Design Philosophy

**Calm Tech**
- No notifications
- No gamification
- No emoji overload
- Just clean, reflective tools for understanding

**Privacy First**
- No accounts
- No tracking
- Conversations are private by default
- Just share the link

**Mobile Native**
- Designed for phones
- Touch-optimized
- Works offline (messages cached)

## Future Enhancements

Potential additions (not in MVP):
- WebSocket support for true real-time updates
- Conversation export (PDF/JSON)
- Pattern recognition across conversation history
- Conversational "health score"
- Multi-person conversations
- End-to-end encryption

## Credits

Created as an exploration of conversational analysis tools.

Analysis frameworks:
- Eric Berne - Transactional Analysis
- J.L. Austin & John Searle - Speech Act Theory
- Various - Discourse Analysis & Power Dynamics

Powered by Claude AI (Anthropic)
