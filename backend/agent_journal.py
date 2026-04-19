"""
Journaling agent using CBT's emotion/cognition/behavior triangle.
Modified for REST API integration with WriteDiary2 frontend.
"""

import json
import os
import time
import logging
from datetime import datetime
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

MODELS = {
    "opus": "claude-opus-4-5-20251101",
    "sonnet": "claude-sonnet-4-20250514",
}


def load_prompts():
    prompt_file = os.path.join(os.path.dirname(__file__), "journal_prompt.txt")
    with open(prompt_file, "r") as f:
        content = f.read()
    sections = {}
    current_section = None
    current_content = []
    for line in content.split("\n"):
        if line.startswith("[") and line.endswith("]"):
            if current_section:
                sections[current_section] = "\n".join(current_content).strip()
            current_section = line[1:-1]
            current_content = []
        else:
            current_content.append(line)
    if current_section:
        sections[current_section] = "\n".join(current_content).strip()
    return sections


_prompts = load_prompts()
SYSTEM_PROMPT = _prompts["SYSTEM_PROMPT"]
REFRAME_PROMPT = _prompts["REFRAME_PROMPT"]
NARRATIVE_PROMPT = _prompts["NARRATIVE_PROMPT"]
SUMMARIZE_PROMPT = _prompts["SUMMARIZE_PROMPT"]
FEEDBACK_PROMPT = _prompts["FEEDBACK_PROMPT"]


def create_llm(model_name=None):
    if model_name is None:
        model_name = os.getenv("CLAUDE_MODEL", "sonnet")
    model_id = MODELS.get(model_name.lower(), model_name)
    return ChatAnthropic(
        model=model_id,
        temperature=0.7,
        max_tokens=1024,
        max_retries=5,
        api_key=ANTHROPIC_API_KEY,
    )


def openai_2_langchain(messages):
    lc_messages = []
    for msg in messages:
        if msg["role"] == "system":
            lc_messages.append(SystemMessage(content=msg["content"]))
        elif msg["role"] == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))
    return lc_messages


class JournalAgent:
    def __init__(self, model=None):
        self.llm = create_llm(model)
        self.model_name = model or os.getenv("CLAUDE_MODEL", "sonnet")
        self.messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]
        self.last_metadata = None
        self.init_journal = None
        self.reframed_journal = None  # dict: {title, tags, body}
        self.final_summary = None
        self.narrative_messages = []
        self.initial_mood = None
        self.final_mood = None

    def cbt_receive(self, user_input, initial_mood=None):
        if initial_mood and self.initial_mood is None:
            self.initial_mood = initial_mood
        if self.init_journal is None:
            prefix = f"[Opening mood: {self.initial_mood}]\n" if self.initial_mood else ""
            self.init_journal = prefix + user_input
        self.messages.append({"role": "user", "content": user_input})

    def cbt_reply(self):
        lc_messages = openai_2_langchain(self.messages)
        start_time = time.time()
        response = self.llm.invoke(lc_messages)
        elapsed_time = time.time() - start_time
        usage = response.response_metadata.get("usage", {})
        self.last_metadata = {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "elapsed_time": elapsed_time,
            "model": self.model_name,
        }
        response_text = response.content
        self.messages.append({"role": "assistant", "content": response_text})
        return response_text

    def reframe(self):
        if not self.init_journal:
            raise ValueError("No initial journal to reframe.")
        conversation_lines = []
        for msg in self.messages[1:]:
            if msg["role"] == "system":
                continue
            role = "You" if msg["role"] == "user" else "Agent"
            conversation_lines.append(f"{role}: {msg['content']}")
        conversation = "\n\n".join(conversation_lines)
        prompt = REFRAME_PROMPT.format(
            init_journal=self.init_journal,
            conversation=conversation,
        )
        reframe_messages = [{"role": "user", "content": prompt}]
        lc_messages = openai_2_langchain(reframe_messages)
        start_time = time.time()
        response = self.llm.invoke(lc_messages)
        elapsed_time = time.time() - start_time
        usage = response.response_metadata.get("usage", {})
        self.last_metadata = {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "elapsed_time": elapsed_time,
            "model": self.model_name,
        }
        raw = response.content.strip()
        try:
            parsed = json.loads(raw)
            self.reframed_journal = {
                "title": parsed.get("title", "My CBT Diary"),
                "tags": parsed.get("tags", []),
                "body": parsed.get("body", raw),
            }
        except json.JSONDecodeError:
            logger.warning("Failed to parse reframe JSON, using fallback. Raw: %s", raw[:200])
            self.reframed_journal = {"title": "My CBT Diary", "tags": [], "body": raw}
        return self.reframed_journal

    def start_narrative(self):
        if not self.reframed_journal:
            raise ValueError("No reframed journal available.")
        body = self.reframed_journal["body"]
        self.origin_reframed_journal = body
        system_content = f"{NARRATIVE_PROMPT}\n\n### Reframed Journal:\n{body}"
        self.narrative_messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "Let's explore this story more deeply."},
        ]
        lc_messages = openai_2_langchain(self.narrative_messages)
        start_time = time.time()
        response = self.llm.invoke(lc_messages)
        elapsed_time = time.time() - start_time
        usage = response.response_metadata.get("usage", {})
        self.last_metadata = {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "elapsed_time": elapsed_time,
            "model": self.model_name,
        }
        response_text = response.content
        self.narrative_messages.append({"role": "assistant", "content": response_text})
        return response_text

    def narrative_receive(self, user_input):
        self.narrative_messages.append({"role": "user", "content": user_input})

    def narrative_reply(self):
        lc_messages = openai_2_langchain(self.narrative_messages)
        start_time = time.time()
        response = self.llm.invoke(lc_messages)
        elapsed_time = time.time() - start_time
        usage = response.response_metadata.get("usage", {})
        self.last_metadata = {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "elapsed_time": elapsed_time,
            "model": self.model_name,
        }
        response_text = response.content
        self.narrative_messages.append({"role": "assistant", "content": response_text})
        return response_text

    def summarize(self):
        if not self.reframed_journal:
            raise ValueError("No reframed journal available.")
        conversation_lines = []
        for msg in self.narrative_messages[2:]:
            if msg["role"] == "system":
                continue
            role = "You" if msg["role"] == "user" else "Agent"
            conversation_lines.append(f"{role}: {msg['content']}")
        conversation = "\n\n".join(conversation_lines)
        prompt = SUMMARIZE_PROMPT.format(
            reframed_journal=self.reframed_journal["body"],
            conversation=conversation,
        )
        summarize_messages = [{"role": "user", "content": prompt}]
        lc_messages = openai_2_langchain(summarize_messages)
        start_time = time.time()
        response = self.llm.invoke(lc_messages)
        elapsed_time = time.time() - start_time
        usage = response.response_metadata.get("usage", {})
        self.last_metadata = {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "elapsed_time": elapsed_time,
            "model": self.model_name,
        }
        summary = response.content
        self.final_summary = summary
        return summary

    def finalize(self):
        if not self.final_summary:
            raise ValueError("No summary available to finalize.")
        title = self.reframed_journal["title"] if self.reframed_journal else "My Diary"
        self.journal_title = title
        origin_story = getattr(self, "origin_reframed_journal", "") or (
            self.reframed_journal["body"] if self.reframed_journal else ""
        )
        system_content = FEEDBACK_PROMPT.format(
            title=title,
            origin_story=origin_story,
            summary=self.final_summary,
        )
        self.finalize_messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": f'I named my diary "{title}".'},
        ]
        lc_messages = openai_2_langchain(self.finalize_messages)
        start_time = time.time()
        response = self.llm.invoke(lc_messages)
        elapsed_time = time.time() - start_time
        usage = response.response_metadata.get("usage", {})
        self.last_metadata = {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "elapsed_time": elapsed_time,
            "model": self.model_name,
        }
        response_text = response.content
        self.finalize_messages.append({"role": "assistant", "content": response_text})
        return response_text

    def finalize_receive(self, user_input):
        self.finalize_messages.append({"role": "user", "content": user_input})

    def finalize_reply(self):
        lc_messages = openai_2_langchain(self.finalize_messages)
        start_time = time.time()
        response = self.llm.invoke(lc_messages)
        elapsed_time = time.time() - start_time
        usage = response.response_metadata.get("usage", {})
        self.last_metadata = {
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0),
            "elapsed_time": elapsed_time,
            "model": self.model_name,
        }
        response_text = response.content
        self.finalize_messages.append({"role": "assistant", "content": response_text})
        return response_text

    @property
    def feedback_complete(self):
        # system, user(title), assistant, user, assistant = 5
        return hasattr(self, "finalize_messages") and len(self.finalize_messages) >= 5

    def set_final_mood(self, mood):
        self.final_mood = mood
