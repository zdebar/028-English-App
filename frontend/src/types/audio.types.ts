export interface AudioRecordLocal {
  filename: string; // Unique name with extension
  audioBlob: Blob; // The actual audio file as a Blob
}

export interface AudioMetadataLocal {
  archive_name: string; // Name of the audio archive (e.g., "audio_part1.zip")
  remote_updated_at: string; // The remote file's updated_at timestamp at the time of last download
}
