export interface Episode {
    id: string;
    title: string;
    rating: number;
}

export interface Show {
    id: string;
    title: string;
    rating: number; // Keeps backward compatibility (Total)
    ratings?: {
        total: number;
        ab: number;
        abc1: number;
    };
    image: string;
    description: string;
    season: number;
    ratingHistory: number[];
    episodes: Episode[];
}

export const MOCK_SHOWS: Show[] = [
    {
        id: '1',
        title: 'Kızılcık Şerbeti',
        rating: 9.2,
        image: 'https://via.placeholder.com/300x450',
        description: 'Farklı kültürlere sahip iki ailenin çocukları Doğa ve Fatih’in, yıldırım nikahıyla evlenmesiyle başlayan olaylar zinciri.',
        season: 2,
        ratingHistory: [8.5, 8.8, 9.0, 9.1, 9.2, 8.9, 9.2],
        episodes: [
            { id: 'e1', title: 'Bölüm 50', rating: 9.1 },
            { id: 'e2', title: 'Bölüm 51', rating: 9.2 },
        ]
    },
    {
        id: '2',
        title: 'Bahar',
        rating: 8.8,
        image: 'https://via.placeholder.com/300x450',
        description: 'Büyük hayallerle tıp okuyan, sonrasında hayatını eşine ve iki çocuğuna adayan Bahar’ın ani bir hastalıkla değişen hayatı.',
        season: 1,
        ratingHistory: [7.5, 8.0, 8.5, 8.8, 8.7],
        episodes: [
            { id: 'e1', title: 'Bölüm 10', rating: 8.5 },
            { id: 'e2', title: 'Bölüm 11', rating: 8.8 },
        ]
    },
    {
        id: '3',
        title: 'İnci Taneleri',
        rating: 8.5,
        image: 'https://via.placeholder.com/300x450',
        description: 'Yıllar sonra cezaevinden çıkan Azem Yücedağ’ın, kaybettiklerini bulma mücadelesi.',
        season: 1,
        ratingHistory: [9.0, 8.8, 8.6, 8.5, 8.5],
        episodes: [
            { id: 'e1', title: 'Bölüm 12', rating: 8.6 },
            { id: 'e2', title: 'Bölüm 13', rating: 8.5 },
        ]
    },
    {
        id: '4',
        title: 'Kuruluş Osman',
        rating: 7.9,
        image: 'https://via.placeholder.com/300x450',
        description: 'Osman Bey’in devlet kurma sürecindeki zorlu mücadelesi.',
        season: 5,
        ratingHistory: [7.5, 7.8, 8.0, 7.9, 7.9],
        episodes: [
            { id: 'e1', title: 'Bölüm 150', rating: 7.8 },
            { id: 'e2', title: 'Bölüm 151', rating: 7.9 },
        ]
    },
    {
        id: '5',
        title: 'Yalı Çapkını',
        rating: 7.5,
        image: 'https://via.placeholder.com/300x450',
        description: 'Gaziantepli Korhan Ailesi’nin direği Halis Ağa’nın el bebek gül bebek yetiştirilmiş torunu Ferit’in evlenmesine karar vermesiyle gelişecek olaylar.',
        season: 2,
        ratingHistory: [8.0, 7.8, 7.6, 7.5, 7.4],
        episodes: [
            { id: 'e1', title: 'Bölüm 60', rating: 7.6 },
            { id: 'e2', title: 'Bölüm 61', rating: 7.5 },
        ]
    },
    {
        id: '6',
        title: 'Gönül Dağı',
        rating: 8.2,
        image: 'https://via.placeholder.com/300x450',
        description: 'Bozkırda bir Anadolu masalı... Sapsarı toprakların, yıllarca dile gelen efsanelerin, unutulmaz aşkların hikayesi.',
        season: 4,
        ratingHistory: [8.0, 8.1, 8.2, 8.3, 8.2],
        episodes: [
            { id: 'e1', title: 'Bölüm 130', rating: 8.1 },
            { id: 'e2', title: 'Bölüm 131', rating: 8.2 },
        ]
    }
];

// Replace with your actual GitHub raw URL after pushing
const DATA_URL = 'https://raw.githubusercontent.com/farqab/reyting-takip/main/data/ratings.json';

export const fetchShows = async (): Promise<Show[]> => {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data;
    } catch (error) {
        console.log('Error fetching remote data, using fallback:', error);
        return MOCK_SHOWS;
    }
};
