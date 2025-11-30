import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'favorites';

export const getFavorites = async (): Promise<string[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Error reading favorites', e);
        return [];
    }
};

export const addFavorite = async (id: string) => {
    try {
        const favorites = await getFavorites();
        if (!favorites.includes(id)) {
            const newFavorites = [...favorites, id];
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        }
    } catch (e) {
        console.error('Error adding favorite', e);
    }
};

export const removeFavorite = async (id: string) => {
    try {
        const favorites = await getFavorites();
        const newFavorites = favorites.filter((favId) => favId !== id);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (e) {
        console.error('Error removing favorite', e);
    }
};

export const isFavorite = async (id: string): Promise<boolean> => {
    const favorites = await getFavorites();
    return favorites.includes(id);
};
