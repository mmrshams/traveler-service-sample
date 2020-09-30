const Validators = ({ JoiValidatorMiddleware }) => (
  JoiValidatorMiddleware({
    defaultValidator: {
      query: {}
    }
  })
)

export default Validators
