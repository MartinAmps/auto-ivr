## Auto IVR Example

This demo is largely based on a [blog post](https://www.twilio.com/blog/live-transcribing-phone-calls-using-twilio-media-streams-and-google-speech-text) illustrating how to implement realtime transcriptions using Google's [speech to text](https://cloud.google.com/speech-to-text/) API. What's different, is it uses the data to automatically navigate through a Studio flow as an example of how one could implement an automated testing strategy.

## Usage

1. Copy .env.example to .env and populate the information
2. Obtain credentials (I save them as creds.json) for Google Cloud
3. Run the script


## Studio Flow Tested Against

![Screenshot of Studio](/screenshots/studio.png?raw=true "Studio Flow")

## Example output

![Auto IVR Running](/screenshots/running.png?raw=true "Auto IVR In action")
