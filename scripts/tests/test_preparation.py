import unittest
import warnings

import pandas as pd

from scripts.utils.preparation import fill_is_vocabulary


class FillIsVocabularyTests(unittest.TestCase):
    def test_derives_missing_values_without_dtype_warning(self) -> None:
        data_frame = pd.DataFrame(
            {
                "is_vocabulary": [float("nan"), float("nan"), 0.0],
                "grammar_chunk_id": [float("nan"), 12, float("nan")],
            }
        )

        with warnings.catch_warnings():
            warnings.simplefilter("error", FutureWarning)
            result = fill_is_vocabulary(data_frame)

        self.assertEqual(result["is_vocabulary"].tolist(), [True, False, 0.0])

    def test_adds_missing_column_and_derives_vocabulary_values(self) -> None:
        data_frame = pd.DataFrame({"grammar_chunk_id": [float("nan"), 12]})

        result = fill_is_vocabulary(data_frame)

        self.assertEqual(result["is_vocabulary"].tolist(), [True, False])


if __name__ == "__main__":
    unittest.main()
