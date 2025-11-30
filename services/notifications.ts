// import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: false,
//         shouldShowBanner: true,
//         shouldShowList: true,
//     }),
// });

export async function registerForPushNotificationsAsync() {
    console.log('Notifications disabled for Expo Go compatibility');
    return;
    // if (Platform.OS === 'android') {
    //     await Notifications.setNotificationChannelAsync('default', {
    //         name: 'default',
    //         importance: Notifications.AndroidImportance.MAX,
    //         vibrationPattern: [0, 250, 250, 250],
    //         lightColor: '#FF231F7C',
    //     });
    // }

    // try {
    //     const { status: existingStatus } = await Notifications.getPermissionsAsync();
    //     let finalStatus = existingStatus;
    //     if (existingStatus !== 'granted') {
    //         const { status } = await Notifications.requestPermissionsAsync();
    //         finalStatus = status;
    //     }
    //     if (finalStatus !== 'granted') {
    //         console.log('Failed to get push token for push notification!');
    //         return;
    //     }
    // } catch (error) {
    //     console.log('Error getting permissions:', error);
    // }
}

export async function schedulePushNotification(title: string, body: string, seconds: number = 2) {
    console.log('Notification scheduled (mock):', title, body);
    // await Notifications.scheduleNotificationAsync({
    //     content: {
    //         title: title,
    //         body: body,
    //         data: { data: 'goes here' },
    //     },
    //     trigger: {
    //         type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    //         seconds: seconds,
    //         repeats: false
    //     },
    // });
}
