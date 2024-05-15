"""
File: app\globalclass\crypto.py

This file is giving cryptography lib
"""
import hashlib, base64

class CryptoLib():

    @staticmethod
    def generate_sha256(string_input):
        sha256 = hashlib.sha256()
        sha256.update(string_input.encode('ascii'))
        hash_value = sha256.hexdigest()

        return hash_value
    
    @staticmethod
    def encode_base64(string_input):
        string_bytes = string_input.encode('ascii')
        base64_bytes = base64.b64encode(string_bytes)
        base64_string = base64_bytes.decode('ascii')

        return base64_string

    @staticmethod
    def decode_base64(base64_string_input):
        base64_bytes = base64_string_input.encode('ascii')
        string_bytes = base64.b64decode(base64_bytes)
        string_message = string_bytes.decode('ascii')

        return string_message