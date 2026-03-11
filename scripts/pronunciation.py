import asyncio

async def fill_pronunciation(df, lang="en-us"):
    async def get_pron(word):
        try:
            if word:
                return await get_IPA_pronunciation(word.replace(",", ""), lang)
            else:
                return ""
        except Exception as e:
            print(f"Error getting IPA pronunciation for '{word}': {e}")
            return ""
    pronunciations = await asyncio.gather(*(get_pron(word) for word in df["english"]))
    df["pronunciation"] = pronunciations
    return df

async def get_IPA_pronunciation(word: str, accent: str) -> str | None:
    """
    Gets IPA pronunciation of the word using espeak-ng. Works with espeak_ng installed in predefined location.

    Args:
        word (str): source word
        accent (str): intended accent
            "en-gb": british english
            "en-us": us english
            "fr": french
            "de": german
            "es": spanish

    Returns:
        str: IPA transcription
    """
    espeak_ng_path = r"C:/Program Files/eSpeak NG/espeak-ng.exe"
    result = await asyncio.create_subprocess_exec(
        espeak_ng_path, "-q", "--ipa", "-v", accent, word,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await result.communicate()

    if stderr:
        error_message = stderr.decode('utf-8').strip()
        print(f"Error occurred while processing word '{word}': {error_message}")
        return None
    
    return stdout.decode('utf-8').strip() if stdout else None