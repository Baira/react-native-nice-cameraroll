import { renderHook } from '@testing-library/react-hooks';
import { useCameraRoll } from '../CameraRoll';
import RNCCameraRoll from '../nativeInterface';

jest.mock('../nativeInterface', () => ({
  getPhotos: jest.fn(),
  saveToCameraRoll: jest.fn(),
}));

describe('useCameraRoll()', () => {
  it('should return initial photos by default', () => {
    const { result } = renderHook(() => useCameraRoll());

    expect(result.current).toEqual({
      photos: {
        edges: [],
        page_info: { end_cursor: '', has_next_page: false, start_cursor: '' },
      },
      getPhotos: expect.any(Function),
      saveToCameraRoll: expect.any(Function),
    });
  });

  describe('saveToCameraRoll()', () => {
    it('should invoke save with passed params', () => {
      const tag = 'mock-tag';
      const type = 'video';
      const { result } = renderHook(() => useCameraRoll());
      const { saveToCameraRoll } = result.current;

      RNCCameraRoll.saveToCameraRoll.mockResolvedValueOnce('');
      saveToCameraRoll(tag, { type });

      expect(RNCCameraRoll.saveToCameraRoll).toBeCalledWith(tag, { type, album: '' });
    });
  });

  describe('getPhotos()', () => {
    const createPhotosMock = ({
      edges = [],
      has_next_page = false,
      start_cursor = '',
      end_cursor = '',
      limited = false,
    } = {}) => ({
      edges,
      limited,
      page_info: { has_next_page, start_cursor, end_cursor },
    });

    it('should invoke getPhotos with default params', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useCameraRoll());
      const { getPhotos } = result.current;

      RNCCameraRoll.getPhotos.mockResolvedValueOnce(createPhotosMock());
      getPhotos();

      await waitForNextUpdate();

      expect(RNCCameraRoll.getPhotos).toHaveBeenCalledWith({
        assetType: 'All',
        first: 20,
        groupTypes: 'All',
      });
    });

    it('should invoke getPhotos with custom params', async () => {
      const customParams = { first: 1, assetType: 'Photos', include: ['filename'] };
      const { result, waitForNextUpdate } = renderHook(() => useCameraRoll());
      const { getPhotos } = result.current;

      RNCCameraRoll.getPhotos.mockResolvedValueOnce(createPhotosMock());
      getPhotos(customParams);

      await waitForNextUpdate();

      expect(RNCCameraRoll.getPhotos).toHaveBeenCalledWith({
        assetType: 'Photos',
        first: 1,
        groupTypes: 'All',
        include: ['filename'],
      });
    });

    it('should return result of getPhotos', async () => {
      const mockPhotos = createPhotosMock({ edges: [{ node: { type: 'mock-type' } }] });
      const { result, waitForNextUpdate } = renderHook(() => useCameraRoll());
      const { getPhotos } = result.current;

      RNCCameraRoll.getPhotos.mockResolvedValueOnce(mockPhotos);
      getPhotos();

      await waitForNextUpdate();

      const { photos } = result.current;

      expect(photos).toEqual(mockPhotos);
    });

    it('should handle an error when invoke getPhotos', async () => {
      const error = new Error('Ops...');
      const { result } = renderHook(() => useCameraRoll());
      const { photos: initialPhotos, getPhotos } = result.current;

      RNCCameraRoll.getPhotos.mockRejectedValueOnce(error);
      getPhotos();

      const { photos: afterError } = result.current;

      expect(initialPhotos).toBe(afterError);
    });
  });
});
