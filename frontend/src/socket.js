import { io } from 'socket.io-client';

let socket;
let currentOrigin = '';

export const getSocket = (apiBase) => {
  const origin = apiBase.replace(/\/api\/?$/, '');

  if (!socket || currentOrigin !== origin) {
    if (socket) socket.disconnect();
    currentOrigin = origin;
    socket = io(origin, {
      transports: ['websocket', 'polling'],
    });
  }

  return socket;
};
