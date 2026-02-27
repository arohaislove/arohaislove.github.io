# Tasker Comms Capture Setup Guide

This guide shows you how to capture your phone communications (WhatsApp, SMS, calls) and automatically send them to your Second Brain worker for analysis.

## What Gets Captured

| Source | Direction | Method |
|--------|-----------|--------|
| WhatsApp, Messenger, etc. | Incoming | AutoNotification (notification intercept) |
| Native SMS | Incoming | Tasker native "Received Text" event |
| Native SMS | **Outgoing** | Tasker native "SMS Sent" event |

## What You'll Need

1. **Tasker** ($3.49 on Play Store) - Main automation app
2. **AutoNotification** (free/paid on Play Store) - Reads notifications (for WhatsApp etc.)
3. **Your Second Brain AUTH_TOKEN** - Same token you use for the capture interface

## How It Works

```
Phone receives message → AutoNotification intercepts → Tasker captures details → POSTs to Second Brain → Analyzed in morning briefing

You send SMS → Android fires SMS_SENT broadcast → Tasker captures it → POSTs to Second Brain
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
- **Event Behavior**: Select **"Only Posted Notifications"** (prevents duplicate updates)
- **Only Posted Notifications**: Check this box
- **Exclude Ongoing Notifications**: Check this box
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

### Step 5: Capture Native SMS — Both Directions

The AutoNotification setup above captures messaging app notifications (WhatsApp, Messenger, etc.), but for **native Android SMS** you can use Tasker's built-in phone events instead. These are more reliable for SMS and, crucially, can capture **outgoing** messages too.

#### Profile A: Incoming SMS (Native Tasker — no AutoNotification needed)

This captures SMS from your Messages app directly, including the sender's phone number.

1. Tap **"+"** → **"Event"** → **"Phone"** → **"Received Text"**
2. Leave all fields blank (captures all SMS)
3. Tap **✓** → name the task **"Capture Incoming SMS"**

**Add HTTP Request action:**
- **Method**: POST
- **URL**: `https://second-brain.zammel.workers.dev/comms`
- **Headers**:
  ```
  Content-Type:application/json
  Authorization:Bearer YOUR_AUTH_TOKEN_HERE
  ```
- **Body**:
  ```json
  {
    "message": "%SMSRB",
    "direction": "incoming",
    "app": "sms",
    "contact": "%SMSRF"
  }
  ```

Tasker variables:
- `%SMSRB` — the message body
- `%SMSRF` — the sender's phone number

#### Profile B: Outgoing SMS

This captures messages you send from the native Messages app.

1. Tap **"+"** → **"Event"** → **"Phone"** → **"SMS Sent"**
   - If "SMS Sent" isn't visible, search for it in the event list
2. Leave fields blank (captures all outgoing SMS)
3. Tap **✓** → name the task **"Capture Outgoing SMS"**

**Add HTTP Request action:**
- **Method**: POST
- **URL**: `https://second-brain.zammel.workers.dev/comms`
- **Headers**:
  ```
  Content-Type:application/json
  Authorization:Bearer YOUR_AUTH_TOKEN_HERE
  ```
- **Body**:
  ```json
  {
    "message": "%SMSRB",
    "direction": "outgoing",
    "app": "sms",
    "contact": "%SMSTO"
  }
  ```

Tasker variables:
- `%SMSRB` — the message body you sent
- `%SMSTO` — the recipient's phone number

**Note:** The `SMS Sent` event requires Tasker to have SMS permissions. Go to **Settings → Apps → Tasker → Permissions** and enable **SMS** if prompted.

#### Tip: SMS vs. AutoNotification

- Use **AutoNotification** for WhatsApp, Messenger, Signal, and other messaging apps (notification-based)
- Use **native SMS events** for regular SMS/MMS (more reliable, captures phone numbers, supports outgoing)
- You can have both running simultaneously — the worker deduplicates based on message content + contact + time window

## Tasker Variables Reference

### AutoNotification variables (messaging apps):
- `%antitle` - Notification title (usually sender name)
- `%antext` - Notification text (message content)
- `%anapp` - App package name (e.g., "com.whatsapp")
- `%anid` - Notification ID
- `%antime` - Timestamp

### Native SMS variables:
- `%SMSRB` - SMS body text (incoming or outgoing)
- `%SMSRF` - Sender's phone number (incoming)
- `%SMSTO` - Recipient's phone number (outgoing)
- `%SMSRD` - Received date/time

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

**Server-side deduplication is enabled** - if you send the same message multiple times within 5 minutes, only the first one is stored.

If you're still getting too many:

1. Edit the AutoNotification Intercept configuration
2. Ensure **"Only Posted Notifications"** is checked (prevents updates)
3. Ensure **"Exclude Ongoing Notifications"** is checked
4. Reduce the **Apps** list to only messaging apps
5. Add **Text Filter** to ignore system notifications

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

**Automatic deduplication is now enabled** - the Second Brain worker automatically ignores duplicate messages (same content, contact, and direction) within 5 minutes.

You can also add client-side filtering in Tasker if needed:

1. Create a global variable: `%LAST_COMMS_TEXT`
2. Add **If** condition before HTTP Request:
   - `%antext !~ %LAST_COMMS_TEXT`
3. Add **Variable Set** action after HTTP Request:
   - `%LAST_COMMS_TEXT` = `%antext`

**Note:** This is usually unnecessary since the server handles it.

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
