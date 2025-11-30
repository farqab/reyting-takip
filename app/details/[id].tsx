import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MOCK_SHOWS } from '../../services/mockData';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { addFavorite, removeFavorite, isFavorite } from '../../services/storage';
import { schedulePushNotification } from '../../services/notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function DetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const show = MOCK_SHOWS.find((s) => s.id === id);
    const [isFav, setIsFav] = useState(false);

    useEffect(() => {
        if (id) {
            checkFavoriteStatus();
        }
    }, [id]);

    const checkFavoriteStatus = async () => {
        if (typeof id === 'string') {
            const status = await isFavorite(id);
            setIsFav(status);
        }
    };

    const toggleFavorite = async () => {
        if (typeof id === 'string') {
            if (isFav) {
                await removeFavorite(id);
            } else {
                await addFavorite(id);
            }
            setIsFav(!isFav);
        }
    };

    const handleNotify = async () => {
        if (show) {
            await schedulePushNotification(
                'Reyting Takip',
                `${show.title} için bildirim ayarlandı!`,
                2
            );
            alert('Bildirim 2 saniye içinde gelecek!');
        }
    };

    const renderChart = (data: number[]) => {
        const chartWidth = width - 40;
        const height = 100;
        const max = Math.max(...data, 10);
        const min = Math.min(...data, 0);
        const range = max - min;

        const points = data.map((val, index) => {
            const x = (index / (data.length - 1)) * chartWidth;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <Svg width={chartWidth} height={height}>
                <Defs>
                    <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFD700" stopOpacity="0.5" />
                        <Stop offset="1" stopColor="#FFD700" stopOpacity="0" />
                    </SvgLinearGradient>
                </Defs>
                <Path
                    d={`M0,${height} L${points} L${chartWidth},${height} Z`}
                    fill="url(#grad)"
                />
                <Path
                    d={`M${points}`}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="3"
                />
            </Svg>
        );
    };

    if (!show) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'white' }}>Show not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} bounces={false}>
            <StatusBar barStyle="light-content" />

            {/* Hero Section */}
            <View style={styles.hero}>
                <Image source={{ uri: show.image }} style={styles.heroImage} />
                <LinearGradient
                    colors={['transparent', '#121212']}
                    style={styles.gradient}
                />

                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="white" />
                </TouchableOpacity>

                <View style={styles.heroContent}>
                    <Text style={styles.title}>{show.title}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.seasonBadge}>Sezon {show.season} - Takip</Text>
                    </View>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.playButton} onPress={handleNotify}>
                            <Ionicons name="play" size={20} color="#121212" />
                            <Text style={styles.playButtonText}>Play</Text>
                        </TouchableOpacity>
                        <View style={styles.ratingBox}>
                            <Text style={styles.ratingLabel}>Son Reyting:</Text>
                            <Text style={styles.ratingValue}>{show.rating}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>{show.description}</Text>

                <Text style={styles.sectionTitle}>Sezon {show.season} Reytingleri</Text>
                <View style={styles.chartContainer}>
                    {renderChart(show.ratingHistory)}
                    <View style={styles.chartLabels}>
                        {show.ratingHistory.map((_, i) => (
                            <Text key={i} style={styles.chartLabel}>{i * 2}</Text>
                        ))}
                    </View>
                </View>

                <View style={styles.episodesList}>
                    {show.episodes.map((episode) => (
                        <View key={episode.id} style={styles.episodeCard}>
                            <TouchableOpacity style={styles.playIcon}>
                                <Ionicons name="play" size={16} color="#FFD700" />
                            </TouchableOpacity>
                            <Text style={styles.episodeTitle}>{episode.title}</Text>
                            <View style={styles.episodeRating}>
                                <Ionicons name="star" size={14} color="white" />
                                <Text style={styles.episodeRatingText}>{episode.rating}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    hero: {
        height: 400,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 200,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    heroContent: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    seasonBadge: {
        color: '#ccc',
        fontSize: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    playButtonText: {
        color: '#121212',
        fontWeight: 'bold',
        marginLeft: 5,
        fontSize: 16,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingLabel: {
        color: '#ccc',
        marginRight: 5,
    },
    ratingValue: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    content: {
        padding: 20,
    },
    description: {
        color: '#999',
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 15,
    },
    chartContainer: {
        backgroundColor: '#1E1E1E',
        padding: 15,
        borderRadius: 16,
        marginBottom: 25,
    },
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    chartLabel: {
        color: '#666',
        fontSize: 10,
    },
    episodesList: {
        gap: 10,
    },
    episodeCard: {
        backgroundColor: '#1E1E1E',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
    },
    playIcon: {
        marginRight: 15,
    },
    episodeTitle: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    episodeRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    episodeRatingText: {
        color: '#121212',
        fontWeight: 'bold',
        marginLeft: 4,
    },
});
