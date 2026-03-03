import { format } from 'date-fns';

export const getSystemDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
};

export const parseLocalISO = (s?: string) => {
    if (!s) return new Date();
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
};
