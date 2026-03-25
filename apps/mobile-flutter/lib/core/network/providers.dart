import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectghin/core/network/dio_client.dart';

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());
