import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { MOCK_SHOWS, Show, fetchShows } from '../services/mockData';
import { getFavorites } from '../services/storage';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function WatchlistScreen() {
    const [favorites, setFavorites] = useState<Show[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [])
    );

    const loadFavorites = async () => {
        const favIds = await getFavorites();
        const allShows = await fetchShows();
        const favShows = allShows.filter((show) => favIds.includes(show.id));
        setFavorites(favShows);
    };

    const renderChart = (data: number[]) => {
        const width = 120;
        const height = 40;
        const max = Math.max(...data, 10);
        const min = Math.min(...data, 0);
        const range = max - min;

        const points = data.map((val, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <Svg width={width} height={height}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFD700" stopOpacity="0.5" />
                        <Stop offset="1" stopColor="#FFD700" stopOpacity="0" />
                    </LinearGradient>
                </Defs>
                <Path
                    d={`M0,${height} L${points} L${width},${height} Z`}
                    fill="url(#grad)"
                />
                <Path
                    d={`M${points}`}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="2"
                />
            </Svg>
        );
    };

    const renderItem = ({ item }: { item: Show }) => (
        <Link href={`/details/${item.id}`} asChild>
            <TouchableOpacity style={styles.card}>
                <View style={styles.info}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                    </View>

                    <View style={styles.chartContainer}>
                        {renderChart(item.ratingHistory)}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.ratingLabel}>Son Reyting: <Text style={styles.ratingValue}>{item.rating}</Text></Text>
                        <Ionicons name="arrow-up" size={16} color="#4CAF50" />
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Takip Listem</Text>
            </View>

            {favorites.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="bookmark-outline" size={64} color="#333" />
                    <Text style={styles.emptyText}>Henüz takip ettiğiniz dizi yok.</Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
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
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
});
