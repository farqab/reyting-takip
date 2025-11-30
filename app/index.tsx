import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchShows, Show } from '../services/mockData';
import { StatusBar } from 'expo-status-bar';

export default function Home() {
    const [shows, setShows] = useState<Show[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Tümü');
    const [searchQuery, setSearchQuery] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        loadData();
        // Poll every 10 seconds for demo purposes (real-time feel)
        const interval = setInterval(() => {
            loadData(true);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const data = await fetchShows();
            setShows(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error(error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const filteredShows = shows.filter(show =>
        show.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: Show }) => (
        <View style={styles.card}>
            <View style={styles.info}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{item.title}</Text>
                </View>

                <View style={styles.chartContainer}>
                    {/* Simple visual representation of rating */}
                    <View style={{ height: 4, backgroundColor: '#333', borderRadius: 2, width: '100%' }}>
                        <View style={{ height: 4, backgroundColor: '#FFD700', borderRadius: 2, width: `${(item.rating / 10) * 100}%` }} />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.ratingLabel}>Güncel Reyting</Text>
                    <Text style={styles.ratingValue}>{item.rating}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Reyting</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.headerTitle}>Takip</Text>
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>CANLI</Text>
                        </View>
                    </View>
                    {lastUpdated && (
                        <Text style={styles.lastUpdatedText}>
                            Son güncelleme: {lastUpdated.toLocaleTimeString()}
                        </Text>
                    )}
                </View>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="settings-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Dizi ara..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.tabs}>
                {['Tümü', 'Favoriler', 'Yeni'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FFD700" />
            ) : (
                <FlatList
                    data={filteredShows}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 10,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF4444',
        marginRight: 6,
    },
    liveText: {
        color: '#FF4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    lastUpdatedText: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        marginHorizontal: 20,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 45,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
    },
    tab: {
        marginRight: 20,
        paddingBottom: 5,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#FFD700',
    },
    tabText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFD700',
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    chartContainer: {
        height: 40,
        justifyContent: 'center',
        marginVertical: 5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingLabel: {
        color: '#888',
        fontSize: 12,
    },
    ratingValue: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
});
