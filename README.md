# OST
#### An experiment combining vision with sound

OST uses colorThief to grab dominant colors from each video frame, then makes calls to the Spotify and EchoNest APIs to play
Appropriate music. Lessons were learned about GetUserMedia, and the experimental MediaStream API, which differes from device
to device. Enable chrome://flags for experimental web technology and, if running on an Android device, disable user touch 
to play audio programmatically. 

In order for the mobile functionality of the app to work, expose a local tunnel to your localhost via ngrok or lt, and serve the page up over https (grabbing camera data over http is disabled in updated versions of chrome).
