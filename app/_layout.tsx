import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { View } from 'react-native';

export default function Layout() {
    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#FFD700', // Gold color
                tabBarInactiveTintColor: '#666',
                tabBarStyle: {
                    backgroundColor: '#121212',
                    borderTopColor: '#333',
                    height: 60,
                    paddingBottom: 8,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Ana Sayfa',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="discover"
                options={{
                    title: 'Keşfet',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="compass-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="watchlist"
                options={{
                    title: 'Takip Listem',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bookmark" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="details/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' }, // Hide tab bar on details
                }}
            />
        </Tabs>
    );
}
