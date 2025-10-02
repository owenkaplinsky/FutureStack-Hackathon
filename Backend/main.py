import feedparser
import urllib.parse
import time
from datetime import datetime
import os
from dotenv import load_dotenv
from cerebras.cloud.sdk import Cerebras
from newspaper import Article
import json
import difflib
import requests
import markdown
from playwright.sync_api import sync_playwright, Error as PlaywrightError


####################
#   Create Query   #
####################


def get_news_feed(query: str, limit: int = 15, start_date: datetime = datetime(2025, 9, 25, 0, 0, 0)):
    # Encode the query into a URL
    encoded_query = urllib.parse.quote(query)
    time_diff = int((datetime.now() - start_date).total_seconds() / 3600)
    feed_url = f"https://news.google.com/rss/search?q={encoded_query}+when:{time_diff}h"

    feed = feedparser.parse(feed_url)
    length = len(feed.entries)

    output = ""
    output_dict = {}

    for i in range(length):
        entry = feed.entries[i]
        published = getattr(entry, "published", None)
        published_parsed = getattr(entry, "published_parsed", None)

        # Skip if no timestamp
        if not published_parsed:
            continue

        entry_date = datetime.fromtimestamp(time.mktime(published_parsed))

        title = entry.title
        link = entry.link

        output += f"{title} - {published if published else 'No timestamp'}\n\n"
        output_dict[title] = {
            "link": link,
            "published": published
        }

        if len(output_dict) >= limit:
            break

    return output_dict, output.strip()

start_messages = [
    {"role": "system", "content": """
    You are a helpful AI. You will be connected to an RSS feed based on the user's request. 
    Instead of being reactive, you will be proactive to the RSS feed and contact the user 
    when any item matches. If something might match, call the 'Mark' tool.
    
    There will not always be relevant items, so do not call the 'Mark' tool because you feel obligated.

    Workflow:
    1. User sends request.
    2. Use the 'Hook' tool to create EXACTLY 7 distinct searches.
    3. You will receive the top 5 results per search. Use 'Mark' to flag relevant ones.
    
    Rules for searches:
    - No superficial variations. Do not create searches that only differ by one vague word. It literally must be extremely different. You are making 7 independent searches, not 7 similar ones.
        (e.g., "OpenAI research" vs. "OpenAI innovation").
    - Each search must represent a distinct angle of the request (e.g., policy, technical 
        breakthroughs, collaborations, controversies, societal impacts).
    - All searches must remain clearly relevant to the user request. Do not drift into 
        unrelated areas just to make them different.
    - Keep searches concise: 2-5 words each.
    - Prioritize recall. Err on the side of including items that might be relevant. 
        Avoid narrowing too much.

    Example user request: "I want to be notified if there's any news about governments 
    creating new regulations specifically for AI safety research."
    Three good searches:
    - "government AI safety regulation"
    - "policy frameworks for AI risk research"
    - "AI governance oversight research initiatives"

    These are all relevant, but capture different aspects of the request. 
     
    YOU ARE REQUIRED TO MAKE 7 OF THEM. THIS IS NOT NEGOTIABLE. NO LESS THAN SEVEN.
    These must be VERY different rom each other. The entire point is that they capture different items in the RSS feeds, and if they're too similar they will overlap - which is bad.

    Aim to reduce false negatives at all costs. If an item has ANY possibility of being relevant, you must include it. ONLY remove the titles that are OBVIOUSLY irrelevant to the user's request. And by OBVIOUSLY, this means ENTIRELY irrelevant, not just mostly.
    """}
]

# Tools used for RSS hook and first filter
start_tools = [
    {
        "type": "function",
        "function": {
            "name": "mark",
            "strict": True,
            "description": "Mark an RSS item as relevant to the user's request.",
            "parameters": {
                "type": "object",
                "properties": {
                    "titles": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "The titles of the relevant articles."
                    }
                },
                "required": ["titles"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "hook",
            "strict": True,
            "description": "Create an RSS feed with Google News.",
            "parameters": {
                "type": "object",
                "properties": {
                    "searches": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "The RSS searches you want to make. You can use spaces"
                    }
                },
                "required": ["searches"]
            }
        }
    }
]

# Functions for LLM chat
load_dotenv()

api_key = os.getenv("API_KEY")
or_key = os.getenv("OR_KEY")

client = Cerebras(
  api_key=api_key,
)

def cerebras_completion(messages, tools):
  chat_completion = client.chat.completions.create(
    messages=messages,
    tools=tools,
    model="llama-4-scout-17b-16e-instruct"
  )

  message = chat_completion.choices[0].message
  message_resp = message.content
  tool_name, tool_contents = None, None

  # Case 1: structured tool call
  if message.tool_calls:
      tool_name = message.tool_calls[0].function.name
      tool_contents = message.tool_calls[0].function.arguments

  # Case 2: raw JSON in content (sometimes the model forgets to use parenthesis for tools and uses brackets instead)
  else:
      try:
          parsed = json.loads(message_resp)
          if "name" in parsed and "arguments" in parsed:
              tool_name = parsed["name"]
              tool_contents = parsed["arguments"]
          message_resp = None
      except Exception:
          pass

  return message_resp, tool_name, tool_contents

def openrouter_completion(messages, tools):
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {or_key}",
            "Content-Type": "application/json",
        },
        data=json.dumps({
            "model": "meta-llama/llama-4-scout",
            "messages": messages,
            "tools": tools,
            "provider": {
                "order": ["cerebras"],
                "allow_fallbacks": False
            }
        })
    )

    # Parse top-level JSON
    resp = response.json()
    message = resp["choices"][0]["message"]
    message_resp = message.get("content")
    tool_name, tool_contents = None, None

    # Case 1: structured tool call
    if "tool_calls" in message and message["tool_calls"]:
        tool_name = message["tool_calls"][0]["function"]["name"]
        tool_contents = message["tool_calls"][0]["function"]["arguments"]

    # Case 2: raw JSON in content
    elif message_resp:
        try:
            parsed = json.loads(message_resp)
            if "name" in parsed and "arguments" in parsed:
                tool_name = parsed["name"]
                tool_contents = parsed["arguments"]
                message_resp = None  # tool call, not plain content
        except Exception:
            pass

    return message_resp, tool_name, tool_contents

def chat(messages, tools=None, need_tool=False):
    for _ in range(3):
        # message, tool_name, tool_contents = cerebras_completion(messages, tools)

        message, tool_name, tool_contents = openrouter_completion(messages, tools)

        if need_tool and not tool_name:
            continue # retry if a tool is required

        return message, tool_name, tool_contents

    # If it's still nothing
    return message, tool_name, tool_contents

# Fuzzy matching since the AI sometimes does not include parts of the title
def find_best_match(model_title, news_dict):
    matches = difflib.get_close_matches(model_title, news_dict.keys(), n=1, cutoff=0.5)
    if matches:
        return news_dict[matches[0]]
    return ""


def create_query(user_query: str):
    """
    user_query: The query from the user.
    """

    messages = list(start_messages) + [{"role": "user", "content": user_query}]

    # Initial chat, get RSS setup
    _, _, tool_contents = chat(messages, start_tools, True)
    if isinstance(tool_contents, str):
        tool_contents = json.loads(tool_contents)

    searches = tool_contents["searches"]

    return searches


####################
#   Refresh Data   #
####################


def refresh_data(user_query: str, searches: list, last_time: datetime):
    """
    user_query: The query from the user.
    searches: All of the 7 searches.
    last_time: Last time that a cron job was run.
    """


    ####################
    #   First Filter   #
    ####################


    print("=== FILTER ROUND ONE ===")
    print()

    all_rss_items = [] # everything pulled from RSS
    chosen_titles = [] # everything chosen by model
    all_news_dicts = [] # raw rss dicts

    valid_items = 0

    for search in searches:
        output_dict, output_str = get_news_feed(search, start_date=last_time)

        # If there are no results
        if output_str == '':
            print("=== NO NEW ITEMS ===")
            continue
        else:
            print(f"=== {len(output_dict)} NEW ITEMS ===")

        valid_items += len(output_dict)

        messages = list(start_messages) + [
            {"role": "assistant", "content": f"{output_str} This is a list of the most recent RSS items for the search '{search}'. I will now use tool 'mark' if any of the items' titles seem like they could possibly apply to the user's query. I will avoid False Negatives, preferring False Positives. I will NOT use 'hook' because I already did that."},
        ]
        _, _, tool_contents = chat(messages, start_tools, True)

        # Handle tool calling issues
        if isinstance(tool_contents, str):
            titles = json.loads(tool_contents)["titles"]
        elif isinstance(tool_contents, dict):
            titles = tool_contents["titles"]

        all_rss_items.extend(output_dict.keys())
        chosen_titles.extend(titles)
        all_news_dicts.append(output_dict)

    # Deduplicate RSS titles
    all_rss_items = list(dict.fromkeys(all_rss_items))
    chosen_titles = list(dict.fromkeys(chosen_titles))

    if len(all_rss_items) == 0:
        return []

    # Merge all dicts
    combined_news_dict = {}
    for nd in all_news_dicts:
        combined_news_dict.update(nd)

    # Map chosen titles to links
    chosen_dict = {}
    for t in chosen_titles:
        chosen_dict[t] = find_best_match(t, combined_news_dict)


    #####################
    #   Second Filter   #
    #####################


    print(f"=== FILTER ROUND TWO ({len(chosen_dict)} ITEMS) ===")
    print()

    # Google News is annoying. This gets the actual URL instead of Google's redirect
    def resolve_url(url: str) -> str:
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=7000)
                    try:
                        page.wait_for_load_state("networkidle", timeout=5000)
                    except Exception:
                        pass
                    final_url = page.evaluate("window.location.href")
                except Exception as e:
                    final_url = f"ERROR: navigation failed ({e})"
                browser.close()
                return final_url
        except PlaywrightError as e:
            return f"ERROR: Playwright failed ({e})"
        except Exception as e:
            return f"ERROR: unexpected failure ({e})"

    # Gets the content of the webpage
    def get_main_content(url: str) -> str:
        try:
            final_url = resolve_url(url)
            if final_url.startswith("ERROR:"):
                return final_url

            article = Article(final_url)
            article.download()
            article.parse()
            return article.text
        except Exception as e:
            return f"ERROR: failed to get main content ({e})"

    eval_tools = [
        {
            "type": "function",
            "function": {
                "name": "mark",
                "strict": True,
                "description": "Mark the article/page as relevant or not.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "relevant": {
                            "type": "boolean",
                            "description": "Use True if it is relevant, False if it is not."
                        },
                        "reason": {
                            "type": "string",
                            "description": "ALWAYS FILL THIS OUT IF RELEVANT IS TRUE. A detailed explanation (approximately 200 words). Specifically, spend most of the words on the important details and info the page contains, and the last bit on how it is relevant to the user query. For the main content, make sure to include all specific information such as names, proper nouns, places, events, times, groups, etc. Your goal is not summarization as much as it is to gather the very relevent and specific information. Do not make this generic - include the important stuff that the article goes over. Pack as much specific information in the main content as you can, and then at the very end tie it back to the user."
                        }
                    },
                    "required": ["relevant"]
                }
            }
        }
    ]

    passed_items = []

    for item, meta in chosen_dict.items():
        print(f"=== ITEM ===")
        print(item)

        date = meta["published"]

        link = meta["link"]
        link = resolve_url(link)

        content = get_main_content(link)[:3000]

        # Article is empty or a stub
        if (len(content) < 200):
            print(f"! Item is very short or empty !")
            continue

        messages = list(start_messages) + [
            {
                "role": "assistant",
                "content": f"""
                ARTICLE TITLE: {item}
                ARTICLE CONTENT (first 3000 chars):
                {content}

                INSTRUCTIONS:
                1. I will decide strictly if the article is relevant to the query. I will NOT mark it relevant just because it mentions a keyword. If it does not address the query, I will mark `relevant = false`.
                2. If relevant = true, I'll:
                - Write a detailed explanation (200-250 words).
                - Focus on concrete details that appear in the article. I will NOT generalize.
                - Cover at least 90% of the important content from this excerpt.
                - End the explanation by explicitly tying the article back to the user query.
                3. If relevant = false:
                - I will not write any explanation or summary. I'll only return `relevant = false`.

                I will not say things such as "contains specific details". Instead, I will provide the exact specific details, not just mention that they exist.
                
                Specific Details to Always Include (when present):
                - Numbers, dates, and statistics (percentages, counts, totals, averages, ranges, rankings)
                - Names of people and groups (individuals, organizations, companies, institutions, agencies)
                - Geographic references (countries, cities, regions, local areas)
                - Events and milestones (announcements, launches, agreements, disasters, protests, meetings)
                - Quotes and statements (from officials, experts, witnesses, participants)
                - Policies and rules (laws, regulations, programs, reforms, restrictions, standards)
                - Technologies and methods (tools, systems, processes, techniques)
                - Economic indicators (prices, costs, investments, budgets, trade figures)
                - Social impacts (effects on communities, health, education, migration, lifestyles)
                - Environmental factors (weather, climate, land, water, resources, ecosystems)
                - Other obviously relevant things not on this list.

                I am REQUIRED to say ALL specific details I see that are relevant. I will NOT cut ANY of them.
                
                Additionally, I will use quotes for important information that matters verbatum.
                I will *literally* use a minimum of 200 words.

                I am currently evaluating whether this article is relevant to the user query: '{user_query}'. The user query is specific, and exact. I will respect that, and NEVER pass any items that aren't relevant to the query.

                I will understand that there is nuance to whether something is relevant or not. Here are some examples that can ground me:
                
                Query: "housing market"  
                "Federal Reserve raises interest rates, cooling mortgage demand" Relevant  
                Explanation: Not about houses directly, but interest rates strongly shape the housing market.  
                "Celebrity buys luxury mansion" Not relevant  
                Explanation: Involves a house, but it's gossip, not market trends.  

                Query: "renewable energy"  
                "State bans new natural gas plants" Relevant  
                Explanation: This isn't about renewables by name, but policy indirectly pushes renewable adoption.  
                "Utility raises electricity prices after storm" Not relevant  
                Explanation: Energy-related, but about infrastructure costs, not renewable policy or adoption.  

                Query: "AI in healthcare"  
                "FDA delays approval of new AI diagnostic tool" Relevant  
                Explanation: Regulatory decision, not hospital deployment, but it directly impacts healthcare AI use.  
                "AI company raises $50M in funding" Not relevant  
                Explanation: AI-related, but no healthcare connection unless specified.  

                As I can see now, I need to focus on the heart of the user's query, not the exact semantics unless they make it EXTREMELY, 100% clear that they need it dialed in.

                My output must strictly use the `mark` function schema.
                """
            }
        ]
        _, tool_name, tool_contents = chat(messages, eval_tools, True)

        # Handle tool calling issues
        parsed = None
        if tool_contents:
            if isinstance(tool_contents, dict):
                parsed = tool_contents
            else:
                try:
                    parsed = json.loads(tool_contents)
                except json.JSONDecodeError:
                    fixed = tool_contents.replace("true", "True").replace("false", "False")
                    try:
                        parsed = eval(fixed, {"__builtins__": None}, {})
                    except Exception:
                        parsed = tool_contents

        # If the AI marked the item as relevant, add to list
        if parsed and isinstance(parsed, dict) and parsed.get("relevant") == True:
            passed_items.append([item, link, date, parsed.get("reason", "")])
            print("! ITEM PASSED !")
        else:
            print("! ITEM FAILED !")

        # We don't need more than this!
        if len(passed_items) >= 10:
            break

    return passed_items


#####################
#   Create Report   #
#####################


def create_report(user_query: str, vetted_items: dict, last_report: datetime):
    """
    user_query: The query from the user.
    vetted_items: All items that got past both filters.
    last_report: Last time that the user got a report; first time a cron job was run for this report.
    """

    current_time = datetime.now()

    def create_content_str(items):
        full = ""
        for name, link, date, reason in items:
            full += f"=== ITEM NAME ===\n{name}\n"
            full += f"=== ITEM LINK (To cite) ===\n{link}\n"
            full += f"=== ITEM DATE ===\n{date}\n"
            full += f"=== ITEM INFO (LLM generated) ===\n{reason}\n\n"
        return full

    report_messages = list(start_messages) + [
        {"role": "assistant", "content": f"""
        {create_content_str(vetted_items)}
        These are all items relevant to the query: '{user_query}'.

        INSTRUCTIONS:
        1. Write 750 words AT MINIMUM in Markdown with clear structure using # (H1) and ## (H2) headings. Do NOT overuse these - you can and SHOULD do multiple paragraphs under one.
        2. Use the most reputable source for each piece of information and avoid duplication.
        3. Use specific information such as numbers, events, people, etc. where useful; do not avoid using these.
        4. Naturally connect all information back to the query, and combine sources when appropriate.
        5. Begin by addressing the query directly, explaining what has developed since ({last_report}) up to today ({current_time}), including how much time has passed.
        6. Never write dates (like "2025-09-29", "Sep 29, 2025", or UTC strings). Always write relative time only, e.g. "3 hours ago", "2 days ago", or "2 weeks ago".
        7. Conclude by explaining why the updates matter, adding context rather than summarizing obvious knowledge.
        8. Do not mention being an AI or proactive agent, and do not use words like "proactive." Write directly to the reader ("you") when appropriate.
        9. Always cite inline like this: ([Source Website Name](https://example.com) - TIME AGO). 
        - Parentheses must wrap the citation. 
        - The clickable text must ALWAYS be the EXACT website name, NOT the article title, NOT the raw link.
        - Place citations immediately after the information, not at the end.
        - YOU ARE NOT ALLOWED TO CASUALLY CITE THINGS LIKE "For example, SOURCE said..." YOU ARE REQUIRED TO CITE IT AT THE END OF TALKING ABOUT THE CONTENT.
        - YOU MUST ALWAYS INCLUDE THE LINK TO THE ARTICLE. YOU CANNOT MENTION THAT IT EXISTS WITHOUT LINKING TO IT.

        The goal is to provide timely updates on new developments since the last interaction, not background knowledge. The writing should feel polished, informative, and up-to-date.

        It is entirely okay to use multiple sources in the same paragraph. Don't always try to make one paragraph per source if it doesn't naturally flow that way.

        Remember, 750 words MINIMUM.
        """}
    ]
    message, _, _ = chat(report_messages)

    message = markdown.markdown(message)

    return message