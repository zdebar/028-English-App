import unittest
import warnings

import pandas as pd

from scripts.utils.preparation import fill_is_vocabulary


class FillIsVocabularyTests(unittest.TestCase):
    def test_defaults_missing_values_and_preserves_explicit_values(self) -> None:
        data_frame = pd.DataFrame(
            {
                "is_vocabulary": [float("nan"), float("nan"), 0.0],
            }
        )

        with warnings.catch_warnings():
            warnings.simplefilter("error", FutureWarning)
            result = fill_is_vocabulary(data_frame)

        self.assertEqual(result["is_vocabulary"].tolist(), [True, True, 0.0])

    def test_adds_missing_column_and_defaults_to_vocabulary(self) -> None:
        data_frame = pd.DataFrame({"english": ["hello", "world"]})

        result = fill_is_vocabulary(data_frame)

        self.assertEqual(result["is_vocabulary"].tolist(), [True, True])


if __name__ == "__main__":
    unittest.main()
