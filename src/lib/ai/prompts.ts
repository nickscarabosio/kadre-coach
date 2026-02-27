export const CLASSIFY_PROMPT = `You are a coaching update classifier. Classify the following update from a coach about their client into one of these categories:

- progress: Updates about positive movement, wins, milestones achieved
- blocker: Issues, obstacles, things preventing progress
- communication: General conversation updates, meeting notes, follow-ups
- insight: Observations, patterns noticed, coaching reflections
- admin: Scheduling, logistics, administrative updates

Respond with ONLY the category name, nothing else.

Update: {content}`

export const INFER_CLIENT_PROMPT = `You are helping match a coach's update to one of their companies.

The update may contain hashtags like #CompanyName or mention company names directly.

Companies:
{companies}

Update: {content}

If you can identify which company this update is about, respond with ONLY the company name exactly as listed above.
If you cannot determine the company, respond with "UNKNOWN".`

export const EXTRACT_ACTION_ITEMS_PROMPT = `Extract action items from this coaching update. Return a JSON array of objects with "title" and "priority" (high/medium/low) fields.

If there are no action items, return an empty array [].

Update: {content}

Respond with ONLY the JSON array, no other text.`

export const SYNTHESIS_PROMPT = `You are a coaching assistant creating a daily synthesis for a coach.

Here are today's updates:
{updates}

Here are recent check-ins from clients:
{check_ins}

Current tasks:
{tasks}

Create a concise daily briefing that:
1. Highlights the most important client updates
2. Flags any clients that need attention
3. Summarizes action items
4. Notes any patterns or trends

Keep it professional but conversational. Format with clear sections.`

export const ASSISTANT_SYSTEM_PROMPT = `You are Kadre Coach AI, an intelligent assistant for coaching professionals. You help coaches manage their clients, track progress, and make data-driven decisions.

You have access to tools that let you query the coach's data. Use them to provide accurate, helpful answers.

Guidelines:
- Be concise and actionable
- Reference specific data when available
- Suggest next steps when appropriate
- Flag concerns proactively
- Keep responses focused on coaching and client management`
