import asyncio
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import ModuleType, SimpleNamespace
from unittest.mock import Mock, patch

import pandas as pd


dotenv_module = ModuleType("dotenv")
dotenv_module.load_dotenv = lambda: None

texttospeech_module = ModuleType("google.cloud.texttospeech")
texttospeech_module.TextToSpeechClient = Mock
texttospeech_module.SynthesisInput = lambda **kwargs: SimpleNamespace(**kwargs)
texttospeech_module.VoiceSelectionParams = lambda **kwargs: SimpleNamespace(**kwargs)
texttospeech_module.AudioConfig = lambda **kwargs: SimpleNamespace(**kwargs)
texttospeech_module.SsmlVoiceGender = SimpleNamespace(FEMALE="FEMALE")
texttospeech_module.AudioEncoding = SimpleNamespace(OGG_OPUS="OGG_OPUS")

google_module = ModuleType("google")
google_module.__path__ = []
cloud_module = ModuleType("google.cloud")
cloud_module.__path__ = []
cloud_module.texttospeech = texttospeech_module
google_module.cloud = cloud_module

sys.modules["dotenv"] = dotenv_module
sys.modules["google"] = google_module
sys.modules["google.cloud"] = cloud_module
sys.modules["google.cloud.texttospeech"] = texttospeech_module

from scripts.utils.audio import generate_audio_with_google_cloud_from_ipa


class GenerateAudioFromIpaTests(unittest.TestCase):
    def test_normalizes_ipa_and_overwrites_existing_audio_with_us_voice(self) -> None:
        data_frame = pd.DataFrame(
            [{"english": "live", "pronunciation": "/lɪv/"}],
        )
        client = Mock()
        client.synthesize_speech.return_value = SimpleNamespace(audio_content=b"ipa audio")

        with tempfile.TemporaryDirectory() as temp_dir:
            audio_path = Path(temp_dir) / "live.opus"
            audio_path.write_bytes(b"text audio")

            with patch.dict(os.environ, {"GCP_TTS_VOICE_NAME": "en-GB-Neural2-C"}, clear=True):
                with patch("scripts.utils.audio.texttospeech.TextToSpeechClient", return_value=client):
                    result = asyncio.run(
                        generate_audio_with_google_cloud_from_ipa(
                            data_frame,
                            temp_dir,
                            overwrite_existing=True,
                        )
                    )

            self.assertEqual(audio_path.read_bytes(), b"ipa audio")
            self.assertEqual(result.loc[0, "audio"], "live.opus")

        synthesis_input = client.synthesize_speech.call_args.kwargs["input"]
        self.assertEqual(
            synthesis_input.ssml,
            '<speak><phoneme alphabet="ipa" ph="lɪv">live</phoneme></speak>',
        )
        self.assertFalse(hasattr(synthesis_input, "text"))

        voice = client.synthesize_speech.call_args.kwargs["voice"]
        self.assertEqual(voice.language_code, "en-US")
        self.assertEqual(voice.name, "en-US-Neural2-F")


if __name__ == "__main__":
    unittest.main()
