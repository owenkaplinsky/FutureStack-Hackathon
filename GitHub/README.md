# Proactive AI

## Problem

Normally, you have to message LLMs if you want information, such as up-to-date news. Recently, sites like ChatGPT have added features such as scheduling messages, where the AI sends you a message at a certain time. But, the issue is that these are always at a set time, and don't have custom triggers. But what if you want to know when something happens dynamically - something that isn't time dependent and isn't predictable?

## Solution

Our project allows a LLM (llama-4-scout) to use RSS feeds. It can dynamically find out when things happen, all on its own. With reasoning and chain-of-thought, we can let it determine when there is enough relevant information to proactively reach out to a user, such as with push notifications.

This allows for you to find out about dynamic things, such as but not limited to:
- Breaking news
- New job postings
- Track updates on games or software
- Notify you when something is trending
- And more!

Importantly, this doesn't just reach out to you with a collection of links. Instead, the LLM compiles a report with all relevant information, making it easy to digest information easily and understand why it matters, what it means, and more.

## Explanation

![](flowchart.webp)

---

### Step 1 - Setup

First, we take in the user's request. Immediately, llama creates 7 RSS searches designed to capture different angles of the query. This way, we get more coverage of articles and less duplicates.

We set up a cron job to periodically check for new content.

### Step 2 - Filter One

Every time the cron job runs, we get a list of new RSS items. After deduplication, we then use the llama to filter out only obviously irrelevant items, avoiding false negatives. This way, we can save tokens while having a lower risk of losing important content.

If the amount of accepted items is greater than a certain amount, we can proceed to the next step.

### Step 3 - Filter Two

Now, with the list of items that passed the first filter, we can evaluate them under the second filter. This time, we *do* use the contents of the webpage in the llama call. Llama either filters out the item, or creats a 200 word summary with important details that are specifically mentioned. This is important for Step 4.

### Step 4 - Reporting

Once we have all of our items that passed both filters, we can format them into one call. We send llama the following information per item:
- The title of the item.
- The link of the item (and therefore the source website).
- The date it was published.
- The previously generated information from Step 3.

Now, llama can create a narrative report, citing all information and providing specific information. The user is then notified that their report is waiting for them!