import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';

/// Service for handling camera and gallery image selection.
class CameraService {
  final ImagePicker _picker;

  CameraService({ImagePicker? picker}) : _picker = picker ?? ImagePicker();

  /// Take a photo using the device camera.
  /// 
  /// Returns the image bytes if successful, null if cancelled.
  Future<Uint8List?> takePhoto() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 2048,
        maxHeight: 2048,
      );
      
      if (image != null) {
        return await image.readAsBytes();
      }
      return null;
    } catch (e) {
      print('Error taking photo: $e');
      return null;
    }
  }

  /// Pick an image from the device gallery.
  /// 
  /// Returns the image bytes if successful, null if cancelled.
  Future<Uint8List?> pickFromGallery() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 2048,
        maxHeight: 2048,
      );
      
      if (image != null) {
        return await image.readAsBytes();
      }
      return null;
    } catch (e) {
      print('Error picking image: $e');
      return null;
    }
  }

  /// Pick multiple images from the device gallery.
  /// 
  /// Returns a list of image bytes. Empty list if cancelled.
  Future<List<Uint8List>> pickMultipleFromGallery() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(
        imageQuality: 85,
        maxWidth: 2048,
        maxHeight: 2048,
      );
      
      final List<Uint8List> imageBytes = [];
      for (final image in images) {
        imageBytes.add(await image.readAsBytes());
      }
      return imageBytes;
    } catch (e) {
      print('Error picking images: $e');
      return [];
    }
  }
}

