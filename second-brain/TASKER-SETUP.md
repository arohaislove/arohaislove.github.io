# Tasker Comms Capture Setup Guide

This guide shows you how to capture your phone communications (WhatsApp, SMS, calls) and automatically send them to your Second Brain worker for analysis.

## What You'll Need

1. **Tasker** ($3.49 on Play Store) - Main automation app
2. **AutoNotification** (free/paid on Play Store) - Reads notifications
3. **Your Second Brain AUTH_TOKEN** - Same token you use for the capture interface

## How It Works

```
Phone receives message → AutoNotification intercepts → Tasker captures details → POSTs to Second Brain → Analyzed in morning briefing
```

## Installation Steps

### Step 1: Install the Apps

1. Install **Tasker** from Play Store
2. Install **AutoNotification** from Play Store
3. Open both apps and grant all requested permissions

### Step 2: Enable Notification Access

1. Go to **Settings → Apps → Special app access → Notification access**
2. Enable for **AutoNotification**
3. Enable for **Tasker** (if prompted)

### Step 3: Create Your First Profile (Incoming Messages)

#### Open Tasker and create a new Profile:

1. Tap **"+"** (bottom right)
2. Select **"Event"**
3. Choose **"Plugin"** → **"AutoNotification"** → **"AutoNotification Intercept"**

#### Configure AutoNotification Intercept:

Tap the **pencil icon** to configure:

- **Apps**: Select the apps you want to capture (WhatsApp, Messages, Messenger, etc.)
  - Tap the **app list icon**, check the apps you want
- **Get Text**: Check this box
- **Get Title**: Check this box
- **Notification Actions**: Leave unchecked
- Leave everything else as default

Tap **✓** (checkmark) to save

#### Create the Task:

1. Tap **"New Task +"**
2. Name it: **"Capture Incoming Comms"**
3. Tap **✓** to create

#### Add Actions to the Task:

**Action 1: HTTP Request to Second Brain**

1. Tap **"+"** to add action
2. Search for **"HTTP Request"** (under Net category)
3. Configure:
   - **Method**: POST
   - **URL**: `https://second-brain.zammel.workers.dev/comms`
   - **Headers**:
     ```
     Content-Type:application/json
     Authorization:Bearer YOUR_AUTH_TOKEN_HERE
     ```
     (Replace `YOUR_AUTH_TOKEN_HERE` with your actual token)
   - **Body**:
     ```json
     {
       "message": "%antitle\n%antext",
       "direction": "incoming",
       "app": "%anapp",
       "contact": "%antitle"
     }
     ```
   - **Timeout**: 30 seconds
   - **Trust Any Certificate**: Off
4. Tap **✓** (checkmark) to save

**Action 2: Flash Confirmation (Optional)**

1. Tap **"+"** to add action
2. Search for **"Flash"** (under Alert category)
3. Configure:
   - **Text**: `Captured: %antitle`
   - **Long**: Off
4. Tap **✓** to save

#### Save Everything:

1. Tap **← (back arrow)** to return to Profile list
2. Your profile should now be active (green toggle)

### Step 4: Test It!

1. Send yourself a test WhatsApp or SMS message
2. You should see a brief flash: "Captured: [sender]"
3. Check your Second Brain dashboard - the message should appear as a new comms item

### Step 5: Create Profile for Outgoing Messages (Optional - Advanced)

This is trickier because Tasker can't directly intercept your sent messages. Here are two approaches:

#### Option A: Exit Event Capture (Simple)

1. Create new **Profile** → **"Event"** → **"App"** → **"Exit Application"**
2. Select apps: WhatsApp, Messages, etc.
3. Create task: **"Capture Exit Snapshot"**
4. Add action: **Plugin → AutoInput → UI Query**
   - Configure to read on-screen text
   - Extract recent messages
   - POST to `/comms` with `"direction": "outgoing"`

**Note**: This is imprecise and may capture messages you're viewing, not just sending.

#### Option B: Manual Quick Tile (Recommended)

Create a manual capture button for when you send important messages:

1. Create **Task** (not Profile): **"Capture Last Message"**
2. Add **AutoInput UI Query** to read clipboard or screen
3. Add **HTTP Request** with `"direction": "outgoing"`
4. Go to **Tasker → Preferences → Action Tab**
5. Add this task as a **Quick Settings Tile**
6. Tap the tile after sending important messages

## Tasker Variables Reference

AutoNotification provides these variables you can use:

- `%antitle` - Notification title (usually sender name)
- `%antext` - Notification text (message content)
- `%anapp` - App package name (e.g., "com.whatsapp")
- `%anid` - Notification ID
- `%antime` - Timestamp

## Troubleshooting

### Messages not being captured:

1. Check Tasker profile is **enabled** (green toggle)
2. Verify **AutoNotification** has notification access (Settings → Apps)
3. Test by sending yourself a message - you should see the flash
4. Check Tasker **Run Log** (three-dot menu → More → Run Log)

### HTTP Request failing:

1. Verify your **AUTH_TOKEN** is correct
2. Check your **internet connection**
3. Test the endpoint manually with curl:
   ```bash
   curl -X POST https://second-brain.zammel.workers.dev/comms \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Test", "direction": "incoming", "app": "test", "contact": "test"}'
   ```
4. Check Tasker **Run Log** for error messages

### Too many notifications being captured:

1. Edit the AutoNotification Intercept configuration
2. Reduce the **Apps** list to only messaging apps
3. Add **Text Filter** to ignore system notifications

### Battery drain:

- Tasker is very efficient, but if you notice drain:
  - Reduce number of apps being monitored
  - Disable the "Flash" confirmation action
  - Check Tasker isn't stuck in a loop (Run Log)

## Privacy & Security

**Important considerations:**

1. **Your messages are stored in Second Brain** - they'll be analyzed by Claude
2. **AUTH_TOKEN is in plain text** in Tasker - keep your phone locked
3. **No encryption at rest** - messages are in KV storage
4. **Consider excluding sensitive apps** - maybe skip banking or medical apps

## Advanced: Filter by Keywords

You can make Tasker only capture messages containing certain keywords:

1. Edit your **"Capture Incoming Comms"** task
2. Add action **before** the HTTP Request:
3. **Task → If** condition
   - Configure: `%antext ~ *important*` (matches messages with "important")
4. Move HTTP Request **inside** the If block
5. Add **Task → End If** after HTTP Request

Now only messages matching your filter will be captured.

## Advanced: Deduplicate Messages

If you get multiple notifications for the same message:

1. Create a global variable: `%LAST_COMMS_TEXT`
2. Add **If** condition before HTTP Request:
   - `%antext !~ %LAST_COMMS_TEXT`
3. Add **Variable Set** action after HTTP Request:
   - `%LAST_COMMS_TEXT` = `%antext`

## What Happens Next?

Once Tasker is capturing your comms:

1. **Messages are stored** in Second Brain as `type: "comms"`
2. **Morning briefing analyzes** communication patterns
3. **Claude notices**:
   - Who you're talking to most
   - Who you might be avoiding
   - Response timing patterns
   - Relationships that need attention

The system won't quote your messages in notifications (privacy), but it **will** spot patterns you might miss.

## Next Steps

- **Test with a few apps first** - don't enable everything at once
- **Check morning briefing** tomorrow to see comms analysis
- **Refine filters** based on what's actually useful
- **Consider outgoing capture** if you want fuller context

## Questions?

- Check Tasker's built-in **User Guide** (three-dot menu → Help)
- Visit r/Tasker on Reddit for community support
- AutoNotification docs: [joaoapps.com/autonotification](https://joaoapps.com/autonotification)

---

**Remember**: The goal isn't to capture everything - it's to give Second Brain enough context to spot patterns and coach you on your communication rhythms. Start simple, see what's useful, iterate.
