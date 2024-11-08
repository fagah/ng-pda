import { RxStompConfig } from '@stomp/rx-stomp';

export const rxStompConfig: RxStompConfig = {
  // brokerURL: 'ws://ec2-15-237-118-140.eu-west-3.compute.amazonaws.com:8081/pda-ws',
  brokerURL: 'ws://192.168.2.238:8081/pda-ws',
  // brokerURL: 'ws://10.189.155.18:8081/pda-ws',
  // brokerURL: 'wss://voucher.numero-uno.ci/pda-ws',
  heartbeatIncoming: 0,
  heartbeatOutgoing: 20000,
  reconnectDelay: 2000,
  debug: (msg: string): void => {
    console.log(new Date(), msg);
  },
};
