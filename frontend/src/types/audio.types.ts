export interface AudioRecordLocal {
  filename: string; // Unique name with extension
  audioBlob: Blob; // The actual audio file as a Blob
}

export interface AudioMetadataLocal {
  archive_name: string; // Name of the audio archive (e.g., "audio_part1.zip")
  fetched_at: string; // Timestamp when the archive was fetched
}
