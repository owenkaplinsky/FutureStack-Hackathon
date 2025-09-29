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