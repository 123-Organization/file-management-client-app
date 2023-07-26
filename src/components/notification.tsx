import React from 'react';
import { notification } from 'antd';

type NotificationType = 'success' | 'info' | 'warning' | 'error';
interface NotificationAlertProps {
  type: NotificationType,
  message : string,
  description : string
}

const NotificationAlert: React.FC<NotificationAlertProps> = ({ type, message, description }) => {
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type: NotificationType) => {
    api[type]({
      message,
      description
    });
  };

  return (
    <>
      {contextHolder}
    </>
  )
}

export default NotificationAlert