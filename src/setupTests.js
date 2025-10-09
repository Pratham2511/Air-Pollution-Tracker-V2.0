// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('react-leaflet', () => {
	const React = require('react');
	const MockContainer = ({ children }) => React.createElement('div', { 'data-testid': 'leaflet-map' }, children);
	const MockComponent = ({ children }) => React.createElement('div', null, children);

	return {
		MapContainer: MockContainer,
		TileLayer: MockComponent,
		Marker: MockComponent,
		Popup: MockComponent,
		useMap: jest.fn(),
		useMapEvent: jest.fn(),
		useMapEvents: jest.fn(),
	};
});

jest.mock('leaflet', () => ({
	icon: jest.fn(() => ({ createIcon: () => ({}) })),
	divIcon: jest.fn(() => ({ createIcon: () => ({}) })),
	markerClusterGroup: jest.fn(() => ({
		addLayer: jest.fn(),
		clearLayers: jest.fn(),
	})),
}));
