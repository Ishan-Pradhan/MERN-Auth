import {
  Alert,
  AlertIcon,
  Container,
  Flex,
  Text,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

function ResetPassword() {
  return (
    <Flex Flex minH="100vh" justify="center">
      <Container mx="auto" maxW="md" py={12} px={6} textAlign="center">
        {linkIsValid ? (
          <ResetPasswordForm />
        ) : (
          <VStack align="center" spacing={6}>
            <Alert status="error" w="fit-content" borderRadius={12}>
              <AlertIcon />
              Invalid Link
            </Alert>
            <Text color="gray.400">The link is either invalid or expired.</Text>
            <ChakraLink as={Link} to="/password/forgot" replace>
              Request a new password reset link
            </ChakraLink>
          </VStack>
        )}
      </Container>
    </Flex>
  );
}

export default ResetPassword;
