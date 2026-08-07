"""LangChain chat model factory from existing OpenAI / Azure env vars."""

from __future__ import annotations

import os

from langchain_openai import AzureChatOpenAI, ChatOpenAI


def get_chat_model(*, temperature: float = 0.2):
    """
    Build a LangChain chat model for DeepAgents.

    Uses the same env contract as the legacy OpenAI SDK path:
    LLM_PROVIDER=openai|azure, OPENAI_MODEL, and provider-specific keys.
    """
    provider = os.getenv("LLM_PROVIDER", "openai").lower().strip()
    model_name = os.getenv("OPENAI_MODEL", "gpt-5-mini")

    if provider == "azure":
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
        if not api_key or not endpoint:
            raise RuntimeError(
                "Missing Azure settings. Required: AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT"
            )
        return AzureChatOpenAI(
            azure_deployment=model_name,
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version=api_version,
            temperature=temperature,
        )

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY. Set it in backend environment variables.")
    return ChatOpenAI(model=model_name, api_key=api_key, temperature=temperature)


def model_label() -> str:
    provider = os.getenv("LLM_PROVIDER", "openai").lower().strip()
    model_name = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    return f"{provider}:{model_name}"
