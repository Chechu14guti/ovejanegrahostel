import { render, screen } from '@testing-library/react';
import { BookingModal } from './BookingModal';
import { describe, it, expect, vi } from 'vitest';
import { Room } from '../types';

const mockRoom: Room = {
    id: '1',
    name: 'Test Room',
    type: 'room',
    color: 'bg-blue-100'
};

describe('BookingModal Component', () => {
    it('renders with the slide-up animation class when open', () => {
        render(
            <BookingModal
                isOpen={true}
                onClose={() => { }}
                selectedDate={new Date()}
                selectedRoom={mockRoom}
                onSave={() => { }}
                onDelete={() => { }}
            />
        );

        // The modal container should have the animation class
        // We look for the text "Nueva Reserva" to find the modal content
        const modalTitle = screen.getByText('Nueva Reserva');
        // The modal container is the parent of the header which contains the title
        // But based on the structure: 
        // <div className="fixed ...">
        //   <div className="... animate-slide-up">
        //     ...
        //   </div>
        // </div>
        // We can find the element with the class directly or traverse up

        // Let's try to find the element that has the class directly
        // Since we can't query by class easily without a test-id, we can check if the container of the title has it or a parent

        const modalContainer = modalTitle.closest('.animate-slide-up');
        expect(modalContainer).toBeInTheDocument();
        expect(modalContainer).toHaveClass('animate-slide-up');
    });

    it('does not render when isOpen is false', () => {
        render(
            <BookingModal
                isOpen={false}
                onClose={() => { }}
                selectedDate={new Date()}
                selectedRoom={mockRoom}
                onSave={() => { }}
                onDelete={() => { }}
            />
        );

        const modalTitle = screen.queryByText('Nueva Reserva');
        expect(modalTitle).not.toBeInTheDocument();
    });
});
