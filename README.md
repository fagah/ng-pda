Passenger Side

Offer (sent to agent): Initiates the WebRTC connection.
ICE Candidate (sent to agent): Sends ICE candidates during the connection process.
Answer (received from agent): Sets the remote description after the agent accepts the offer.
Call Rejected (received from agent): Displays a rejection message if the agent declines.
Hangup (sent to end the call).

## Explanation of Key Methods Passenger

# Initiate the call

Start a call by sending an offer to the agent.
Send ICE candidates to the agent as they are generated.
Receive and handle an answer from the agent.
Respond to a call rejection.
End the call with a hangup notification.

Agent Side

Offer (received from passenger): The agent receives the offer from the passenger.
Answer (sent to passenger): The agent responds to the passenger's offer with an SDP answer.
ICE Candidate (sent to passenger): Sends ICE candidates during the connection process.
Call Rejected (sent to passenger): Sends a rejection message if the agent declines.
Hangup (sent to end the call).


https://stackblitz.com/edit/angular-webrtc?file=app%2Fmeeting%2Fmeeting.component.ts


Testing the Complete Flow
the general flow should be:

Agent initiates call → Offer sent to passenger
Passenger receives offer → Creates an answer and sends it back
Both peers exchange ICE candidates